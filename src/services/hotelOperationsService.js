import { isSupabaseConfigured, supabase } from "./supabaseClient";

function deriveGuestIdFromEmail(email) {
  return `guest-${String(email ?? "").toLowerCase()}`;
}

function deriveProfileIdFromEmail(email) {
  return `profile-${String(email ?? "").toLowerCase()}`;
}

function sanitizeFileName(fileName) {
  return String(fileName ?? "upload")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-");
}

function requireConfiguredOperationsClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("This workspace is not ready yet. Please check the admin connection settings.");
  }
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data?.user ?? null;
}

async function resolveReservationRowByReference(requestReference) {
  const { data, error } = await supabase
    .from("reservations")
    .select("id, hotel_id, request_reference, room_type_code, assigned_room_id, status")
    .eq("request_reference", requestReference)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function syncGuestProfile({ hotelId, fullName, email, phone, preferredChannel = "Admin", loyaltyTier = "Unknown", notes = "" }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const payload = {
    hotel_id: hotelId,
    full_name: fullName,
    email: normalizedEmail,
    phone: phone || null,
    preferred_channel: preferredChannel,
    loyalty_tier: loyaltyTier,
    notes: notes || null,
  };

  const { error } = await supabase
    .from("guest_profiles")
    .upsert(payload, { onConflict: "hotel_id,email" });

  if (error) {
    throw error;
  }

  return payload;
}

function buildRoomTypeTitleIndex(roomTypeRows) {
  return new Map(roomTypeRows.map((item) => [item.id, item.title]));
}

function buildRoomTypeGalleryIndex(roomTypeGalleryRows) {
  return roomTypeGalleryRows.reduce((index, item) => {
    const current = index.get(item.room_type_id) ?? [];
    current.push({
      id: item.id,
      image: item.image_url,
      alt: item.alt_text ?? "Room gallery image",
      displayOrder: item.display_order ?? 0,
    });
    index.set(item.room_type_id, current);
    return index;
  }, new Map());
}

async function syncRoomTypeGallery({ roomTypeId, galleryImages = [] }) {
  const { error: deleteError } = await supabase
    .from("room_type_gallery_images")
    .delete()
    .eq("room_type_id", roomTypeId);

  if (deleteError) {
    throw deleteError;
  }

  const normalizedImages = galleryImages
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          image_url: item.trim(),
          alt_text: "",
          display_order: index + 1,
        };
      }

      return {
        image_url: String(item.image ?? "").trim(),
        alt_text: item.alt ?? "",
        display_order: Number(item.displayOrder ?? index + 1),
      };
    })
    .filter((item) => item.image_url);

  if (!normalizedImages.length) {
    return;
  }

  const { error: insertError } = await supabase.from("room_type_gallery_images").insert(
    normalizedImages.map((item) => ({
      room_type_id: roomTypeId,
      image_url: item.image_url,
      alt_text: item.alt_text || null,
      display_order: item.display_order,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export async function fetchHotelOperationsSnapshot() {
  requireConfiguredOperationsClient();

  const currentUser = await getCurrentUser();
  const [{ data: orgRows, error: orgError }, { data: hotelRows, error: hotelError }, { data: roomTypeRows, error: roomTypeError }, { data: roomTypeGalleryRows, error: roomTypeGalleryError }, { data: roomRows, error: roomError }, { data: reservationRows, error: reservationError }, { data: guestRows, error: guestError }, { data: guestProfileRows, error: guestProfileError }, { data: userAccessRows, error: userAccessError }] =
    await Promise.all([
      supabase.from("organizations").select("*"),
      supabase.from("hotels").select("*"),
      supabase.from("room_types").select("*").order("display_order", { ascending: true }),
      supabase.from("room_type_gallery_images").select("*").eq("is_active", true).order("display_order", { ascending: true }),
      supabase.from("rooms").select("*").order("room_code", { ascending: true }),
      supabase.from("reservations").select("*").order("created_at", { ascending: false }),
      supabase.from("reservation_guests").select("*"),
      supabase.from("guest_profiles").select("*"),
      currentUser
        ? supabase.from("user_hotel_access").select("*").eq("user_id", currentUser.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (orgError || hotelError || roomTypeError || roomTypeGalleryError || roomError || reservationError || guestError || guestProfileError || userAccessError) {
    throw orgError || hotelError || roomTypeError || roomTypeGalleryError || roomError || reservationError || guestError || guestProfileError || userAccessError;
  }

  const roomTypeTitleIndex = buildRoomTypeTitleIndex(roomTypeRows);
  const roomTypeGalleryIndex = buildRoomTypeGalleryIndex(roomTypeGalleryRows ?? []);
  const fallbackGuestIndex = new Map(guestRows.map((item) => [item.email.toLowerCase(), item]));

  const guestList = guestProfileRows.map((item) => ({
    id: item.id ?? deriveProfileIdFromEmail(item.email),
    hotelId: item.hotel_id,
    name: item.full_name,
    email: item.email,
    phone: item.phone,
    loyaltyTier: item.loyalty_tier ?? "Unknown",
    preferredChannel: item.preferred_channel ?? "Direct",
    notes: item.notes ?? "",
    createdAt: item.created_at,
  }));

  guestRows.forEach((item) => {
    const normalizedEmail = item.email.toLowerCase();
    if (!guestList.some((guest) => guest.email.toLowerCase() === normalizedEmail)) {
      guestList.push({
        id: deriveProfileIdFromEmail(item.email),
        hotelId: reservationRows.find((reservation) => reservation.id === item.reservation_id)?.hotel_id ?? hotelRows[0]?.id,
        name: item.full_name,
        email: item.email,
        phone: item.phone,
        loyaltyTier: "Unknown",
        preferredChannel: "Direct",
        notes: "",
        createdAt: item.created_at,
      });
    }
  });

  return {
    source: "supabase",
    organizations: orgRows.map((item) => ({
      id: item.id,
      name: item.name,
    })),
    hotels: hotelRows.map((item) => ({
      id: item.id,
      organizationId: item.organization_id,
      name: item.name,
      shortName: item.short_name ?? item.name,
      city: item.city,
      country: item.country,
      code: item.code,
      websiteLabel: item.website_label,
      websiteUrl: item.website_url,
      timezone: item.timezone,
      description: item.description,
    })),
    roomTypes: roomTypeRows.map((item) => ({
      id: item.id,
      hotelId: item.hotel_id,
      code: item.code,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url,
      formImageUrl: item.form_image_url,
      sizeLabel: item.size_label,
      bedLabel: item.bed_label,
      bestFor: item.best_for,
      rateLabel: item.rate_label,
      rateNote: item.rate_note,
      baseRate: Number(item.base_rate ?? 0),
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      galleryImages: roomTypeGalleryIndex.get(item.id) ?? [],
      displayOrder: item.display_order ?? 0,
      maxAdults: item.max_adults ?? 1,
      maxChildren: item.max_children ?? 0,
      isActive: item.is_active ?? true,
    })),
    rooms: roomRows.map((item) => ({
      id: item.id,
      hotelId: item.hotel_id,
      roomTypeId: item.room_type_id,
      roomType: roomTypeTitleIndex.get(item.room_type_id) ?? item.room_code,
      roomCode: item.room_code,
      floor: item.floor_label,
      occupancy: item.occupancy,
      status: item.status,
      housekeeping: item.housekeeping_status,
      amenities: [],
      baseRate: 0,
    })),
    guests: guestList,
    reservations: reservationRows.map((item) => {
      const guestRow =
        guestRows.find((guest) => guest.reservation_id === item.id) ??
        fallbackGuestIndex.get(
          String(
            item.metadata?.guestEmail ??
            item.metadata?.guest_email ??
            "",
          ).toLowerCase(),
        );
      const roomTypeRow = roomTypeRows.find(
        (roomType) => roomType.hotel_id === item.hotel_id && roomType.code === item.room_type_code,
      );
      const roomRow =
        roomRows.find((room) => room.id === item.assigned_room_id) ??
        roomRows.find((room) => room.hotel_id === item.hotel_id && room.room_type_id === roomTypeRow?.id);

      return {
        id: item.request_reference,
        hotelId: item.hotel_id,
        guestId: guestRow ? deriveProfileIdFromEmail(guestRow.email) : `guest-${item.id}`,
        roomId: roomRow?.id ?? item.room_type_code,
        assignedRoomId: item.assigned_room_id ?? roomRow?.id ?? null,
        roomTypeCode: item.room_type_code,
        roomTitle: item.room_title ?? roomTypeRow?.title ?? roomRow?.room_code ?? "Unassigned room type",
        source: item.source,
        status: item.status,
        checkIn: item.check_in,
        checkOut: item.check_out,
        adults: item.adults,
        children: item.children,
        roomCount: item.room_count ?? 1,
        totalAmount: Number(item.estimated_total ?? 0),
        nightlyRate: Number(item.nightly_rate ?? 0),
        createdAt: item.created_at,
        notes: item.guest_message ?? "",
      };
    }),
    currentUserAccess: (userAccessRows ?? []).map((item) => ({
      userId: item.user_id,
      hotelId: item.hotel_id,
      role: item.role,
    })),
  };
}

function getRoomStatusForReservationStatus(status, currentRoomStatus) {
  if (status === "checked_in") {
    return "occupied";
  }

  if (status === "confirmed" || status === "pending") {
    return currentRoomStatus === "occupied" ? currentRoomStatus : "reserved";
  }

  if (status === "checked_out" || status === "cancelled") {
    return "available";
  }

  return currentRoomStatus;
}

export async function updateReservationStatus({ reservationId, nextStatus }) {
  requireConfiguredOperationsClient();

  const reservationRow = await resolveReservationRowByReference(reservationId);

  const { error: reservationUpdateError } = await supabase
    .from("reservations")
    .update({ status: nextStatus })
    .eq("id", reservationRow.id);

  if (reservationUpdateError) {
    throw reservationUpdateError;
  }

  if (reservationRow.assigned_room_id) {
    const { data: roomRow, error: roomLookupError } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("id", reservationRow.assigned_room_id)
      .single();

    if (roomLookupError) {
      throw roomLookupError;
    }

    const nextRoomStatus = getRoomStatusForReservationStatus(nextStatus, roomRow.status);
    const { error: roomUpdateError } = await supabase
      .from("rooms")
      .update({ status: nextRoomStatus })
      .eq("id", roomRow.id);

    if (roomUpdateError) {
      throw roomUpdateError;
    }
  }

  const { error: auditError } = await supabase.from("reservation_audit_log").insert({
    reservation_id: reservationRow.id,
    event_type: "reservation_status_updated",
    event_data: {
      previous_status: reservationRow.status,
      next_status: nextStatus,
      updated_from: "admin-panel",
    },
  });

  if (auditError) {
    throw auditError;
  }

  return { source: "supabase", reservationId, nextStatus };
}

export async function assignReservationRoom({ reservationId, roomId }) {
  requireConfiguredOperationsClient();

  const reservationRow = await resolveReservationRowByReference(reservationId);

  const { data: roomRow, error: roomLookupError } = await supabase
    .from("rooms")
    .select("id, hotel_id")
    .eq("id", roomId)
    .single();

  if (roomLookupError) {
    throw roomLookupError;
  }

  if (roomRow.hotel_id !== reservationRow.hotel_id) {
    throw new Error("This room does not belong to the same hotel as the reservation.");
  }

  const { error: reservationUpdateError } = await supabase
    .from("reservations")
    .update({ assigned_room_id: roomId })
    .eq("id", reservationRow.id);

  if (reservationUpdateError) {
    throw reservationUpdateError;
  }

  const { error: auditError } = await supabase.from("reservation_audit_log").insert({
    reservation_id: reservationRow.id,
    event_type: "reservation_room_assigned",
    event_data: {
      previous_room_id: reservationRow.assigned_room_id,
      next_room_id: roomId,
      updated_from: "admin-panel",
    },
  });

  if (auditError) {
    throw auditError;
  }

  return { source: "supabase", reservationId, roomId };
}

export async function createReservationRecord(payload) {
  requireConfiguredOperationsClient();

  const roomTypeCode = payload.roomTypeCode;
  const requestReference = `ADM-${Date.now()}`;
  const nights = Math.max(
    1,
    Math.round(
      (new Date(`${payload.checkOut}T00:00:00`) - new Date(`${payload.checkIn}T00:00:00`)) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const { data: hotelRow, error: hotelError } = await supabase
    .from("hotels")
    .select("organization_id, currency")
    .eq("id", payload.hotelId)
    .single();

  if (hotelError) {
    throw hotelError;
  }

  const totalAmount = Number(payload.totalAmount ?? 0);
  const nightlyRate = Number(payload.nightlyRate ?? 0);
  const metadata = {
    createdVia: "admin-panel",
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
  };

  const { data: reservationRow, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      request_reference: requestReference,
      organization_id: hotelRow.organization_id,
      hotel_id: payload.hotelId,
      assigned_room_id: payload.assignedRoomId || null,
      source: payload.source || "Front desk",
      status: payload.status || "confirmed",
      room_type_code: roomTypeCode,
      room_title: payload.roomTitle,
      check_in: payload.checkIn,
      check_out: payload.checkOut,
      nights,
      room_count: Number(payload.roomCount ?? 1),
      adults: Number(payload.adults ?? 1),
      children: Number(payload.children ?? 0),
      currency: hotelRow.currency ?? "USD",
      nightly_rate: nightlyRate,
      subtotal: totalAmount,
      taxes_and_fees: 0,
      estimated_total: totalAmount,
      guest_message: payload.notes || null,
      metadata,
    })
    .select("id, request_reference")
    .single();

  if (reservationError) {
    throw reservationError;
  }

  const { error: guestError } = await supabase.from("reservation_guests").insert({
    reservation_id: reservationRow.id,
    full_name: payload.guestName,
    email: String(payload.guestEmail).trim().toLowerCase(),
    phone: payload.guestPhone || null,
  });

  if (guestError) {
    throw guestError;
  }

  await syncGuestProfile({
    hotelId: payload.hotelId,
    fullName: payload.guestName,
    email: payload.guestEmail,
    phone: payload.guestPhone,
    preferredChannel: payload.source || "Front desk",
    notes: payload.notes,
  });

  if (payload.assignedRoomId) {
    await assignReservationRoom({ reservationId: reservationRow.request_reference, roomId: payload.assignedRoomId });
  }

  return {
    source: "supabase",
    reservationId: reservationRow.request_reference,
  };
}

export async function updateReservationRecord({ reservationId, updates }) {
  requireConfiguredOperationsClient();

  const reservationRow = await resolveReservationRowByReference(reservationId);

  const nights = Math.max(
    1,
    Math.round(
      (new Date(`${updates.checkOut}T00:00:00`) - new Date(`${updates.checkIn}T00:00:00`)) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const { error: reservationError } = await supabase
    .from("reservations")
    .update({
      source: updates.source,
      status: updates.status,
      room_type_code: updates.roomTypeCode,
      room_title: updates.roomTitle,
      check_in: updates.checkIn,
      check_out: updates.checkOut,
      nights,
      room_count: Number(updates.roomCount ?? 1),
      adults: Number(updates.adults ?? 1),
      children: Number(updates.children ?? 0),
      nightly_rate: Number(updates.nightlyRate ?? 0),
      subtotal: Number(updates.totalAmount ?? 0),
      estimated_total: Number(updates.totalAmount ?? 0),
      guest_message: updates.notes || null,
    })
    .eq("id", reservationRow.id);

  if (reservationError) {
    throw reservationError;
  }

  const { error: guestError } = await supabase
    .from("reservation_guests")
    .update({
      full_name: updates.guestName,
      email: String(updates.guestEmail).trim().toLowerCase(),
      phone: updates.guestPhone || null,
    })
    .eq("reservation_id", reservationRow.id);

  if (guestError) {
    throw guestError;
  }

  await syncGuestProfile({
    hotelId: updates.hotelId,
    fullName: updates.guestName,
    email: updates.guestEmail,
    phone: updates.guestPhone,
    preferredChannel: updates.source || "Front desk",
    notes: updates.notes,
  });

  if (updates.assignedRoomId) {
    await assignReservationRoom({ reservationId, roomId: updates.assignedRoomId });
  } else if (reservationRow.assigned_room_id) {
    const { error: clearAssignmentError } = await supabase
      .from("reservations")
      .update({ assigned_room_id: null })
      .eq("id", reservationRow.id);

    if (clearAssignmentError) {
      throw clearAssignmentError;
    }
  }

  return { source: "supabase", reservationId };
}

export async function deleteReservationRecord({ reservationId }) {
  requireConfiguredOperationsClient();

  const reservationRow = await resolveReservationRowByReference(reservationId);

  const { error } = await supabase.from("reservations").delete().eq("id", reservationRow.id);
  if (error) {
    throw error;
  }

  return { source: "supabase", reservationId };
}

export async function createGuestProfileRecord(payload) {
  requireConfiguredOperationsClient();

  await syncGuestProfile({
    hotelId: payload.hotelId,
    fullName: payload.name,
    email: payload.email,
    phone: payload.phone,
    loyaltyTier: payload.loyaltyTier,
    preferredChannel: payload.preferredChannel,
    notes: payload.notes,
  });

  return { source: "supabase" };
}

export async function updateGuestProfileRecord({ guestId, updates }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase
    .from("guest_profiles")
    .update({
      full_name: updates.name,
      email: String(updates.email).trim().toLowerCase(),
      phone: updates.phone || null,
      loyalty_tier: updates.loyaltyTier || "Unknown",
      preferred_channel: updates.preferredChannel || "Direct",
      notes: updates.notes || null,
    })
    .eq("id", guestId);

  if (error) {
    throw error;
  }

  return { source: "supabase", guestId };
}

export async function deleteGuestProfileRecord({ guestId }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase.from("guest_profiles").delete().eq("id", guestId);
  if (error) {
    throw error;
  }

  return { source: "supabase", guestId };
}

export async function createRoomTypeRecord(payload) {
  requireConfiguredOperationsClient();

  const { data, error } = await supabase.from("room_types").insert({
    hotel_id: payload.hotelId,
    code: payload.code,
    title: payload.title,
    description: payload.description || null,
    image_url: payload.imageUrl || null,
    form_image_url: payload.formImageUrl || null,
    size_label: payload.sizeLabel || null,
    bed_label: payload.bedLabel || null,
    best_for: payload.bestFor || null,
    rate_label: payload.rateLabel || null,
    rate_note: payload.rateNote || null,
    display_order: Number(payload.displayOrder ?? 0),
    max_adults: Number(payload.maxAdults ?? 1),
    max_children: Number(payload.maxChildren ?? 0),
    base_rate: Number(payload.baseRate ?? 0),
    amenities: payload.amenities ?? [],
    is_active: payload.isActive ?? true,
  }).select("id").single();

  if (error) {
    throw error;
  }

  await syncRoomTypeGallery({ roomTypeId: data.id, galleryImages: payload.galleryImages ?? [] });

  return { source: "supabase", roomTypeId: data.id };
}

export async function uploadRoomTypeMedia({ hotelId, roomTypeId, files, kind = "gallery" }) {
  requireConfiguredOperationsClient();

  const uploadTargets = Array.from(files ?? []).filter(Boolean);
  if (!uploadTargets.length) {
    return { source: "supabase", uploadedImages: [] };
  }

  const uploadedImages = [];

  for (const file of uploadTargets) {
    const extensionSafeName = sanitizeFileName(file.name);
    const filePath = `${hotelId}/room-types/${roomTypeId}/${kind}/${Date.now()}-${extensionSafeName}`;
    const { error: uploadError } = await supabase.storage
      .from("hotel-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("hotel-media").getPublicUrl(filePath);
    uploadedImages.push({
      image: data.publicUrl,
      alt: file.name,
    });
  }

  return { source: "supabase", uploadedImages };
}

export async function updateRoomTypeRecord({ roomTypeId, updates }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase
    .from("room_types")
    .update({
      code: updates.code,
      title: updates.title,
      description: updates.description || null,
      image_url: updates.imageUrl || null,
      form_image_url: updates.formImageUrl || null,
      size_label: updates.sizeLabel || null,
      bed_label: updates.bedLabel || null,
      best_for: updates.bestFor || null,
      rate_label: updates.rateLabel || null,
      rate_note: updates.rateNote || null,
      display_order: Number(updates.displayOrder ?? 0),
      max_adults: Number(updates.maxAdults ?? 1),
      max_children: Number(updates.maxChildren ?? 0),
      base_rate: Number(updates.baseRate ?? 0),
      amenities: updates.amenities ?? [],
      is_active: updates.isActive ?? true,
    })
    .eq("id", roomTypeId);

  if (error) {
    throw error;
  }

  await syncRoomTypeGallery({ roomTypeId, galleryImages: updates.galleryImages ?? [] });

  return { source: "supabase", roomTypeId };
}

export async function deleteRoomTypeRecord({ roomTypeId }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase.from("room_types").delete().eq("id", roomTypeId);
  if (error) {
    throw error;
  }

  return { source: "supabase", roomTypeId };
}

export async function createRoomRecord(payload) {
  requireConfiguredOperationsClient();

  const { error } = await supabase.from("rooms").insert({
    hotel_id: payload.hotelId,
    room_type_id: payload.roomTypeId,
    room_code: payload.roomCode,
    floor_label: payload.floor || null,
    occupancy: Number(payload.occupancy ?? 1),
    status: payload.status || "available",
    housekeeping_status: payload.housekeeping || null,
  });

  if (error) {
    throw error;
  }

  return { source: "supabase" };
}

export async function updateRoomRecord({ roomId, updates }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase
    .from("rooms")
    .update({
      room_type_id: updates.roomTypeId,
      room_code: updates.roomCode,
      floor_label: updates.floor || null,
      occupancy: Number(updates.occupancy ?? 1),
      status: updates.status || "available",
      housekeeping_status: updates.housekeeping || null,
    })
    .eq("id", roomId);

  if (error) {
    throw error;
  }

  return { source: "supabase", roomId };
}

export async function deleteRoomRecord({ roomId }) {
  requireConfiguredOperationsClient();

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) {
    throw error;
  }

  return { source: "supabase", roomId };
}
