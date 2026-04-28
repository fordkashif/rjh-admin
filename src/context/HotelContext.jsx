import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { guests, hotels, organizations, reservations, rooms, roomTypes } from "../data/hotelData";
import {
  assignReservationRoom,
  createGuestProfileRecord,
  createReservationRecord,
  createRoomRecord,
  createRoomTypeRecord,
  deleteGuestProfileRecord,
  deleteReservationRecord,
  deleteRoomRecord,
  deleteRoomTypeRecord,
  fetchHotelOperationsSnapshot,
  uploadRoomTypeMedia,
  updateGuestProfileRecord,
  updateReservationRecord,
  updateReservationStatus,
  updateRoomRecord,
  updateRoomTypeRecord,
} from "../services/hotelOperationsService";

const HOTEL_STORAGE_KEY = "innap:selectedHotelId";
const FALLBACK_ROLE = "owner";

const HotelContext = createContext(null);

function getNights(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function isSameDate(isoDate, comparisonDate) {
  return isoDate === comparisonDate.toISOString().slice(0, 10);
}

export function HotelProvider({ children }) {
  const [dataSource, setDataSource] = useState({
    source: "fallback",
      organizations,
      hotels,
      roomTypes,
      rooms,
      guests,
      reservations,
  });
  const [loadState, setLoadState] = useState({ status: "idle", error: "", source: "fallback" });
  const [actionState, setActionState] = useState({ status: "idle", reservationId: null, action: null, error: "" });
  const [selectedHotelId, setSelectedHotelId] = useState(() => {
    if (typeof window === "undefined") {
      return hotels[0]?.id ?? null;
    }

    return localStorage.getItem(HOTEL_STORAGE_KEY) ?? hotels[0]?.id ?? null;
  });

  async function loadOperationsData() {
    setLoadState((current) => ({
      status: "loading",
      error: "",
      source: current.source ?? "fallback",
    }));

    try {
      const snapshot = await fetchHotelOperationsSnapshot();
      setDataSource(snapshot);
      setLoadState({ status: "ready", error: "", source: snapshot.source ?? "supabase" });
    } catch (error) {
      setDataSource({
        source: "fallback",
        organizations,
        hotels,
        roomTypes,
        rooms,
        guests,
        reservations,
      });
      setLoadState({
        status: "error",
        error: error?.message ?? "Failed to load hotel operations data.",
        source: "fallback",
      });
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDataSafely() {
      if (!isMounted) {
        return;
      }

      await loadOperationsData();
    }

    loadDataSafely();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      localStorage.setItem(HOTEL_STORAGE_KEY, selectedHotelId);
    }
  }, [selectedHotelId]);

  const selectedHotel = useMemo(
    () => dataSource.hotels.find((hotel) => hotel.id === selectedHotelId) ?? dataSource.hotels[0],
    [dataSource.hotels, selectedHotelId],
  );

  const currentUserRole = useMemo(() => {
    const matchedAccess = (dataSource.currentUserAccess ?? []).find((access) => access.hotelId === selectedHotel?.id);
    return matchedAccess?.role ?? FALLBACK_ROLE;
  }, [dataSource.currentUserAccess, selectedHotel]);

  const organization = useMemo(
    () => dataSource.organizations.find((item) => item.id === selectedHotel?.organizationId) ?? dataSource.organizations[0],
    [dataSource.organizations, selectedHotel],
  );

  const reservationsForHotel = useMemo(
    () => dataSource.reservations.filter((reservation) => reservation.hotelId === selectedHotel?.id),
    [dataSource.reservations, selectedHotel],
  );

  const roomsForHotel = useMemo(
    () => dataSource.rooms.filter((room) => room.hotelId === selectedHotel?.id),
    [dataSource.rooms, selectedHotel],
  );

  const guestsForHotel = useMemo(() => {
    const guestIds = new Set(reservationsForHotel.map((reservation) => reservation.guestId));
    return dataSource.guests.filter(
      (guest) => guest.hotelId === selectedHotel?.id || guestIds.has(guest.id),
    );
  }, [dataSource.guests, reservationsForHotel]);

  const roomTypesForHotel = useMemo(
    () => (dataSource.roomTypes ?? []).filter((roomType) => roomType.hotelId === selectedHotel?.id),
    [dataSource.roomTypes, selectedHotel],
  );

  const reservationRecords = useMemo(
    () =>
      reservationsForHotel.map((reservation) => {
        const room = dataSource.rooms.find(
          (item) => item.id === (reservation.assignedRoomId ?? reservation.roomId),
        );
        const guest = dataSource.guests.find((item) => item.id === reservation.guestId);

        return {
          ...reservation,
          room,
          guest,
          nights: getNights(reservation.checkIn, reservation.checkOut),
        };
      }),
    [dataSource.guests, dataSource.rooms, reservationsForHotel],
  );

  const guestRecords = useMemo(
    () =>
      guestsForHotel.map((guest) => {
        const guestReservations = reservationRecords.filter((reservation) => reservation.guestId === guest.id);
        const totalSpend = guestReservations.reduce((sum, reservation) => sum + reservation.totalAmount, 0);

        return {
          ...guest,
          reservationCount: guestReservations.length,
          totalSpend,
          activeReservation:
            guestReservations.find((reservation) => reservation.status === "checked_in") ??
            guestReservations.find((reservation) => reservation.status === "confirmed") ??
            null,
        };
      }),
    [guestsForHotel, reservationRecords],
  );

  const roomRecords = useMemo(() => {
    const reservationByRoomId = new Map(
      reservationRecords
        .filter((reservation) => reservation.status !== "cancelled")
        .filter((reservation) => reservation.assignedRoomId)
        .map((reservation) => [reservation.assignedRoomId, reservation]),
    );

    return roomsForHotel.map((room) => ({
      ...room,
      activeReservation: reservationByRoomId.get(room.id) ?? null,
    }));
  }, [reservationRecords, roomsForHotel]);

  const dashboardMetrics = useMemo(() => {
    const today = new Date("2026-04-28T12:00:00");
    const tomorrow = new Date("2026-04-29T12:00:00");

    return {
      totalReservations: reservationRecords.length,
      arrivalsToday: reservationRecords.filter((reservation) => isSameDate(reservation.checkIn, today)).length,
      unassignedArrivalsToday: reservationRecords.filter(
        (reservation) =>
          isSameDate(reservation.checkIn, today) &&
          (reservation.status === "pending" || reservation.status === "confirmed") &&
          !reservation.assignedRoomId,
      ).length,
      unassignedArrivalsTomorrow: reservationRecords.filter(
        (reservation) =>
          isSameDate(reservation.checkIn, tomorrow) &&
          (reservation.status === "pending" || reservation.status === "confirmed") &&
          !reservation.assignedRoomId,
      ).length,
      inHouse: reservationRecords.filter((reservation) => reservation.status === "checked_in").length,
      upcomingRevenue: reservationRecords
        .filter((reservation) => reservation.status === "confirmed" || reservation.status === "checked_in")
        .reduce((sum, reservation) => sum + reservation.totalAmount, 0),
      occupiedRooms: roomRecords.filter((room) => room.status === "occupied").length,
      availableRooms: roomRecords.filter((room) => room.status === "available").length,
      pendingReservations: reservationRecords.filter((reservation) => reservation.status === "pending").length,
    };
  }, [reservationRecords, roomRecords]);

  const unassignedArrivalRecords = useMemo(
    () =>
      reservationRecords
        .filter(
          (reservation) =>
            (reservation.status === "pending" || reservation.status === "confirmed") &&
            !reservation.assignedRoomId,
        )
        .sort((left, right) => left.checkIn.localeCompare(right.checkIn)),
    [reservationRecords],
  );

  async function applyReservationStatusUpdate(reservationId, nextStatus) {
    setActionState({ status: "submitting", reservationId, action: "status", error: "" });

    try {
      const result = await updateReservationStatus({ reservationId, nextStatus });

      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          reservations: current.reservations.map((reservation) =>
            reservation.id === reservationId
              ? {
                  ...reservation,
                  status: nextStatus,
                }
              : reservation,
          ),
          rooms: current.rooms.map((room) => {
            const reservation = current.reservations.find((item) => item.id === reservationId);

            if (!reservation || room.id !== reservation.roomId) {
              return room;
            }

            if (nextStatus === "checked_in") {
              return { ...room, status: "occupied" };
            }

            if (nextStatus === "confirmed" || nextStatus === "pending") {
              return { ...room, status: room.status === "occupied" ? room.status : "reserved" };
            }

            if (nextStatus === "checked_out" || nextStatus === "cancelled") {
              return { ...room, status: "available" };
            }

            return room;
          }),
        }));
        setLoadState((current) => ({
          ...current,
          source: "fallback",
        }));
      } else {
        await loadOperationsData();
      }

      setActionState({ status: "success", reservationId, action: "status", error: "" });
    } catch (error) {
      setActionState({
        status: "error",
        reservationId,
        action: "status",
        error: error?.message ?? "We could not update the reservation status.",
      });
    }
  }

  async function assignReservationRoomRecord(reservationId, roomId) {
    setActionState({ status: "submitting", reservationId, action: "assignment", error: "" });

    try {
      const result = await assignReservationRoom({ reservationId, roomId });

      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          reservations: current.reservations.map((reservation) =>
            reservation.id === reservationId
              ? {
                  ...reservation,
                  roomId,
                  assignedRoomId: roomId,
                }
              : reservation,
          ),
        }));
      } else {
        await loadOperationsData();
      }

      setActionState({ status: "success", reservationId, action: "assignment", error: "" });
    } catch (error) {
      setActionState({
        status: "error",
        reservationId,
        action: "assignment",
        error: error?.message ?? "We could not assign the room.",
      });
    }
  }

  async function createReservation(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-reservation", error: "" });

    try {
      const result = await createReservationRecord(payload);

      if (result.source === "fallback") {
        const guestId = `guest-${Date.now()}`;
        const reservationId = `res-${Date.now()}`;
        setDataSource((current) => ({
          ...current,
          guests: [
            ...current.guests,
            {
              id: guestId,
              hotelId: payload.hotelId,
              name: payload.guestName,
              email: payload.guestEmail,
              phone: payload.guestPhone,
              loyaltyTier: "Unknown",
              preferredChannel: payload.source || "Front desk",
              notes: payload.notes || "",
            },
          ],
          reservations: [
            {
              id: reservationId,
              hotelId: payload.hotelId,
              guestId,
              roomId: payload.assignedRoomId || payload.roomTypeCode,
              assignedRoomId: payload.assignedRoomId || null,
              roomTypeCode: payload.roomTypeCode,
              roomTitle: payload.roomTitle,
              source: payload.source,
              status: payload.status,
              checkIn: payload.checkIn,
              checkOut: payload.checkOut,
              adults: payload.adults,
              children: payload.children,
              roomCount: payload.roomCount,
              totalAmount: Number(payload.totalAmount ?? 0),
              nightlyRate: Number(payload.nightlyRate ?? 0),
              createdAt: new Date().toISOString(),
              notes: payload.notes || "",
            },
          ],
        }));
      } else {
        await loadOperationsData();
      }

      setActionState({ status: "success", reservationId: null, action: "create-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-reservation", error: error?.message ?? "We could not create the reservation." });
    }
  }

  async function editReservation(reservationId, updates) {
    setActionState({ status: "submitting", reservationId, action: "edit-reservation", error: "" });
    try {
      const result = await updateReservationRecord({ reservationId, updates });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          guests: current.guests.map((guest) =>
            guest.id === updates.guestId
              ? { ...guest, name: updates.guestName, email: updates.guestEmail, phone: updates.guestPhone, preferredChannel: updates.source, notes: updates.notes || guest.notes }
              : guest,
          ),
          reservations: current.reservations.map((reservation) =>
            reservation.id === reservationId
              ? {
                  ...reservation,
                  roomId: updates.assignedRoomId || reservation.roomId,
                  assignedRoomId: updates.assignedRoomId || null,
                  roomTypeCode: updates.roomTypeCode,
                  roomTitle: updates.roomTitle,
                  source: updates.source,
                  status: updates.status,
                  checkIn: updates.checkIn,
                  checkOut: updates.checkOut,
                  adults: updates.adults,
                  children: updates.children,
                  roomCount: updates.roomCount,
                  totalAmount: Number(updates.totalAmount ?? 0),
                  nightlyRate: Number(updates.nightlyRate ?? 0),
                  notes: updates.notes || "",
                }
              : reservation,
          ),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId, action: "edit-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId, action: "edit-reservation", error: error?.message ?? "We could not update the reservation." });
    }
  }

  async function removeReservation(reservationId) {
    setActionState({ status: "submitting", reservationId, action: "delete-reservation", error: "" });
    try {
      const result = await deleteReservationRecord({ reservationId });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          reservations: current.reservations.filter((reservation) => reservation.id !== reservationId),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId, action: "delete-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId, action: "delete-reservation", error: error?.message ?? "We could not delete the reservation." });
    }
  }

  async function createGuest(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-guest", error: "" });
    try {
      const result = await createGuestProfileRecord(payload);
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          guests: [
            ...current.guests,
            {
              id: `guest-${Date.now()}`,
              hotelId: payload.hotelId,
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              loyaltyTier: payload.loyaltyTier,
              preferredChannel: payload.preferredChannel,
              notes: payload.notes || "",
            },
          ],
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: null, action: "create-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-guest", error: error?.message ?? "We could not create the guest profile." });
    }
  }

  async function editGuest(guestId, updates) {
    setActionState({ status: "submitting", reservationId: guestId, action: "edit-guest", error: "" });
    try {
      const result = await updateGuestProfileRecord({ guestId, updates });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          guests: current.guests.map((guest) => (guest.id === guestId ? { ...guest, ...updates, name: updates.name } : guest)),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: guestId, action: "edit-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: guestId, action: "edit-guest", error: error?.message ?? "We could not update the guest profile." });
    }
  }

  async function removeGuest(guestId) {
    setActionState({ status: "submitting", reservationId: guestId, action: "delete-guest", error: "" });
    try {
      const result = await deleteGuestProfileRecord({ guestId });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          guests: current.guests.filter((guest) => guest.id !== guestId),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: guestId, action: "delete-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: guestId, action: "delete-guest", error: error?.message ?? "We could not delete the guest profile." });
    }
  }

  async function createRoomType(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-room-type", error: "" });
    try {
      const result = await createRoomTypeRecord(payload);
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          roomTypes: [
            ...(current.roomTypes ?? []),
            { id: `room-type-${Date.now()}`, ...payload, amenities: payload.amenities ?? [] },
          ],
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: null, action: "create-room-type", error: "" });
      return result;
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-room-type", error: error?.message ?? "We could not create the room type." });
      throw error;
    }
  }

  async function editRoomType(roomTypeId, updates) {
    setActionState({ status: "submitting", reservationId: roomTypeId, action: "edit-room-type", error: "" });
    try {
      const result = await updateRoomTypeRecord({ roomTypeId, updates });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          roomTypes: (current.roomTypes ?? []).map((roomType) => (roomType.id === roomTypeId ? { ...roomType, ...updates, amenities: updates.amenities ?? [] } : roomType)),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: roomTypeId, action: "edit-room-type", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomTypeId, action: "edit-room-type", error: error?.message ?? "We could not update the room type." });
    }
  }

  async function removeRoomType(roomTypeId) {
    setActionState({ status: "submitting", reservationId: roomTypeId, action: "delete-room-type", error: "" });
    try {
      const result = await deleteRoomTypeRecord({ roomTypeId });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          roomTypes: (current.roomTypes ?? []).filter((roomType) => roomType.id !== roomTypeId),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: roomTypeId, action: "delete-room-type", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomTypeId, action: "delete-room-type", error: error?.message ?? "We could not delete the room type." });
    }
  }

  async function uploadRoomTypeImages(roomTypeId, kind, files) {
    setActionState({ status: "submitting", reservationId: roomTypeId, action: "upload-room-images", error: "" });
    try {
      const result = await uploadRoomTypeMedia({
        hotelId: selectedHotel?.id,
        roomTypeId,
        files,
        kind,
      });

      if (result.source === "fallback") {
        setActionState({ status: "success", reservationId: roomTypeId, action: "upload-room-images", error: "" });
        return result.uploadedImages ?? [];
      }

      await loadOperationsData();
      setActionState({ status: "success", reservationId: roomTypeId, action: "upload-room-images", error: "" });
      return result.uploadedImages ?? [];
    } catch (error) {
      setActionState({ status: "error", reservationId: roomTypeId, action: "upload-room-images", error: error?.message ?? "We could not upload the room media." });
      throw error;
    }
  }

  async function createRoom(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-room", error: "" });
    try {
      const result = await createRoomRecord(payload);
      if (result.source === "fallback") {
        const roomType = (dataSource.roomTypes ?? []).find((item) => item.id === payload.roomTypeId);
        setDataSource((current) => ({
          ...current,
          rooms: [
            ...current.rooms,
            {
              id: `room-${Date.now()}`,
              hotelId: payload.hotelId,
              roomTypeId: payload.roomTypeId,
              roomType: roomType?.title ?? payload.roomCode,
              roomCode: payload.roomCode,
              floor: payload.floor,
              occupancy: payload.occupancy,
              status: payload.status,
              housekeeping: payload.housekeeping,
              amenities: [],
              baseRate: 0,
            },
          ],
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: null, action: "create-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-room", error: error?.message ?? "We could not create the room." });
    }
  }

  async function editRoom(roomId, updates) {
    setActionState({ status: "submitting", reservationId: roomId, action: "edit-room", error: "" });
    try {
      const result = await updateRoomRecord({ roomId, updates });
      if (result.source === "fallback") {
        const roomType = (dataSource.roomTypes ?? []).find((item) => item.id === updates.roomTypeId);
        setDataSource((current) => ({
          ...current,
          rooms: current.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  ...updates,
                  roomType: roomType?.title ?? room.roomType,
                  floor: updates.floor,
                  housekeeping: updates.housekeeping,
                }
              : room,
          ),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: roomId, action: "edit-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomId, action: "edit-room", error: error?.message ?? "We could not update the room." });
    }
  }

  async function removeRoom(roomId) {
    setActionState({ status: "submitting", reservationId: roomId, action: "delete-room", error: "" });
    try {
      const result = await deleteRoomRecord({ roomId });
      if (result.source === "fallback") {
        setDataSource((current) => ({
          ...current,
          rooms: current.rooms.filter((room) => room.id !== roomId),
        }));
      } else {
        await loadOperationsData();
      }
      setActionState({ status: "success", reservationId: roomId, action: "delete-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomId, action: "delete-room", error: error?.message ?? "We could not delete the room." });
    }
  }

  const permissions = useMemo(() => ({
    role: currentUserRole,
    canManageStaff: currentUserRole === "owner",
    canManageProperties: currentUserRole === "owner" || currentUserRole === "manager",
    canManageReservations: true,
    canManageGuests: true,
    canManageRooms: true,
  }), [currentUserRole]);

  const value = {
    organization,
    hotels: dataSource.hotels,
    selectedHotel,
    selectedHotelId,
    setSelectedHotelId,
    currentUserRole,
    permissions,
    reservationRecords,
    guestRecords,
    roomRecords,
    roomTypeRecords: roomTypesForHotel,
    dashboardMetrics,
    unassignedArrivalRecords,
    loadState,
    actionState,
    refreshOperationsData: loadOperationsData,
    updateReservationLifecycle: applyReservationStatusUpdate,
    assignReservationRoom: assignReservationRoomRecord,
    createReservation,
    editReservation,
    deleteReservation: removeReservation,
    createGuest,
    editGuest,
    deleteGuest: removeGuest,
    createRoomType,
    editRoomType,
    deleteRoomType: removeRoomType,
    uploadRoomTypeImages,
    createRoom,
    editRoom,
    deleteRoom: removeRoom,
  };

  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

export function useHotelContext() {
  const context = useContext(HotelContext);

  if (!context) {
    throw new Error("useHotelContext must be used within a HotelProvider");
  }

  return context;
}
