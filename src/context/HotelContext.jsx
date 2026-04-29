import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
const EMPTY_DATA_SOURCE = {
  organizations: [],
  hotels: [],
  roomTypes: [],
  rooms: [],
  guests: [],
  reservations: [],
  currentUserAccess: [],
};

const EMPTY_HOTEL = {
  id: "",
  organizationId: "",
  name: "",
  shortName: "",
  city: "",
  country: "",
  code: "",
  websiteLabel: "",
  websiteUrl: "",
  timezone: "",
  description: "",
};

const EMPTY_ORGANIZATION = {
  id: "",
  name: "",
};

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
  const [dataSource, setDataSource] = useState(EMPTY_DATA_SOURCE);
  const [loadState, setLoadState] = useState({ status: "idle", error: "" });
  const [actionState, setActionState] = useState({ status: "idle", reservationId: null, action: null, error: "" });
  const [selectedHotelId, setSelectedHotelId] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(HOTEL_STORAGE_KEY) ?? null;
  });

  async function loadOperationsData() {
    setLoadState({ status: "loading", error: "" });

    try {
      const snapshot = await fetchHotelOperationsSnapshot();
      setDataSource(snapshot);
      setSelectedHotelId((current) => {
        const hasCurrentHotel = snapshot.hotels.some((hotel) => hotel.id === current);
        return hasCurrentHotel ? current : snapshot.hotels[0]?.id ?? null;
      });
      setLoadState({ status: "ready", error: "" });
    } catch (error) {
      setDataSource(EMPTY_DATA_SOURCE);
      setLoadState({
        status: "error",
        error: error?.message ?? "The hotel workspace could not be loaded right now.",
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
    () => dataSource.hotels.find((hotel) => hotel.id === selectedHotelId) ?? dataSource.hotels[0] ?? EMPTY_HOTEL,
    [dataSource.hotels, selectedHotelId],
  );

  const currentUserRole = useMemo(() => {
    const matchedAccess = (dataSource.currentUserAccess ?? []).find((access) => access.hotelId === selectedHotel?.id);
    return matchedAccess?.role ?? null;
  }, [dataSource.currentUserAccess, selectedHotel]);

  const organization = useMemo(
    () => dataSource.organizations.find((item) => item.id === selectedHotel?.organizationId) ?? dataSource.organizations[0] ?? EMPTY_ORGANIZATION,
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
      await updateReservationStatus({ reservationId, nextStatus });
      await loadOperationsData();
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
      await assignReservationRoom({ reservationId, roomId });
      await loadOperationsData();
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
      await createReservationRecord(payload);
      await loadOperationsData();
      setActionState({ status: "success", reservationId: null, action: "create-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-reservation", error: error?.message ?? "We could not create the reservation." });
    }
  }

  async function editReservation(reservationId, updates) {
    setActionState({ status: "submitting", reservationId, action: "edit-reservation", error: "" });
    try {
      await updateReservationRecord({ reservationId, updates });
      await loadOperationsData();
      setActionState({ status: "success", reservationId, action: "edit-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId, action: "edit-reservation", error: error?.message ?? "We could not update the reservation." });
    }
  }

  async function removeReservation(reservationId) {
    setActionState({ status: "submitting", reservationId, action: "delete-reservation", error: "" });
    try {
      await deleteReservationRecord({ reservationId });
      await loadOperationsData();
      setActionState({ status: "success", reservationId, action: "delete-reservation", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId, action: "delete-reservation", error: error?.message ?? "We could not delete the reservation." });
    }
  }

  async function createGuest(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-guest", error: "" });
    try {
      await createGuestProfileRecord(payload);
      await loadOperationsData();
      setActionState({ status: "success", reservationId: null, action: "create-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-guest", error: error?.message ?? "We could not create the guest profile." });
    }
  }

  async function editGuest(guestId, updates) {
    setActionState({ status: "submitting", reservationId: guestId, action: "edit-guest", error: "" });
    try {
      await updateGuestProfileRecord({ guestId, updates });
      await loadOperationsData();
      setActionState({ status: "success", reservationId: guestId, action: "edit-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: guestId, action: "edit-guest", error: error?.message ?? "We could not update the guest profile." });
    }
  }

  async function removeGuest(guestId) {
    setActionState({ status: "submitting", reservationId: guestId, action: "delete-guest", error: "" });
    try {
      await deleteGuestProfileRecord({ guestId });
      await loadOperationsData();
      setActionState({ status: "success", reservationId: guestId, action: "delete-guest", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: guestId, action: "delete-guest", error: error?.message ?? "We could not delete the guest profile." });
    }
  }

  async function createRoomType(payload) {
    setActionState({ status: "submitting", reservationId: null, action: "create-room-type", error: "" });
    try {
      const result = await createRoomTypeRecord(payload);
      await loadOperationsData();
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
      await updateRoomTypeRecord({ roomTypeId, updates });
      await loadOperationsData();
      setActionState({ status: "success", reservationId: roomTypeId, action: "edit-room-type", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomTypeId, action: "edit-room-type", error: error?.message ?? "We could not update the room type." });
    }
  }

  async function removeRoomType(roomTypeId) {
    setActionState({ status: "submitting", reservationId: roomTypeId, action: "delete-room-type", error: "" });
    try {
      await deleteRoomTypeRecord({ roomTypeId });
      await loadOperationsData();
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
      await createRoomRecord(payload);
      await loadOperationsData();
      setActionState({ status: "success", reservationId: null, action: "create-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: null, action: "create-room", error: error?.message ?? "We could not create the room." });
    }
  }

  async function editRoom(roomId, updates) {
    setActionState({ status: "submitting", reservationId: roomId, action: "edit-room", error: "" });
    try {
      await updateRoomRecord({ roomId, updates });
      await loadOperationsData();
      setActionState({ status: "success", reservationId: roomId, action: "edit-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomId, action: "edit-room", error: error?.message ?? "We could not update the room." });
    }
  }

  async function removeRoom(roomId) {
    setActionState({ status: "submitting", reservationId: roomId, action: "delete-room", error: "" });
    try {
      await deleteRoomRecord({ roomId });
      await loadOperationsData();
      setActionState({ status: "success", reservationId: roomId, action: "delete-room", error: "" });
    } catch (error) {
      setActionState({ status: "error", reservationId: roomId, action: "delete-room", error: error?.message ?? "We could not delete the room." });
    }
  }

  const permissions = useMemo(() => ({
    role: currentUserRole,
    canManageStaff: currentUserRole === "owner",
    canManageProperties: currentUserRole === "owner" || currentUserRole === "manager",
    canManageReservations: Boolean(currentUserRole),
    canManageGuests: Boolean(currentUserRole),
    canManageRooms: Boolean(currentUserRole),
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
