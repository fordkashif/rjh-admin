import { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useHotelContext } from "../../../context/HotelContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStatusLabel(status) {
  return String(status ?? "").replaceAll("_", " ");
}

function getReservationStatusBadgeClass(status) {
  if (status === "pending") return "rj-status-badge--pending";
  if (status === "confirmed") return "rj-status-badge--confirmed";
  if (status === "checked_in") return "rj-status-badge--inhouse";
  if (status === "checked_out") return "rj-status-badge--checkedout";
  if (status === "cancelled") return "rj-status-badge--cancelled";
  return "rj-status-badge--neutral";
}

function createReservationFormState(selectedHotelId) {
  return {
    hotelId: selectedHotelId,
    guestId: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    source: "Front desk",
    status: "confirmed",
    roomTypeCode: "",
    roomTitle: "",
    assignedRoomId: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    roomCount: 1,
    nightlyRate: 0,
    totalAmount: 0,
    notes: "",
  };
}

export default function ReservationsPage() {
  const {
    reservationRecords,
    roomRecords,
    roomTypeRecords,
    guestRecords,
    selectedHotelId,
    actionState,
    updateReservationLifecycle,
    assignReservationRoom,
    createReservation,
    editReservation,
    deleteReservation,
    loadState,
  } = useHotelContext();
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [formState, setFormState] = useState(() => createReservationFormState(selectedHotelId));

  const visibleReservations = useMemo(() => {
    if (statusFilter === "all") {
      return reservationRecords;
    }

    return reservationRecords.filter((reservation) => reservation.status === statusFilter);
  }, [reservationRecords, statusFilter]);

  const reservationSnapshot = useMemo(
    () => ({
      total: reservationRecords.length,
      pending: reservationRecords.filter((reservation) => reservation.status === "pending").length,
      confirmed: reservationRecords.filter((reservation) => reservation.status === "confirmed").length,
      inHouse: reservationRecords.filter((reservation) => reservation.status === "checked_in").length,
    }),
    [reservationRecords],
  );

  const roomTypeOptions = useMemo(
    () => roomTypeRecords.map((roomType) => ({ value: roomType.code, label: roomType.title, nightlyRate: roomType.baseRate })),
    [roomTypeRecords],
  );

  const assignableRoomsByReservationId = useMemo(
    () =>
      Object.fromEntries(
        reservationRecords.map((reservation) => [
          reservation.id,
          roomRecords.filter(
            (room) =>
              room.roomType === reservation.roomTitle ||
              room.id === reservation.assignedRoomId ||
              room.id === reservation.roomId,
          ),
        ]),
      ),
    [reservationRecords, roomRecords],
  );

  const assignableRoomsForForm = useMemo(
    () =>
      roomRecords.filter((room) =>
        !formState.roomTitle ? true : room.roomType === formState.roomTitle,
      ),
    [formState.roomTitle, roomRecords],
  );

  function resetForm() {
    setFormState(createReservationFormState(selectedHotelId));
    setEditingReservationId(null);
    setIsReservationModalOpen(false);
  }

  function populateFormFromGuest(guestId) {
    const guest = guestRecords.find((item) => item.id === guestId);
    if (!guest) {
      return;
    }

    setFormState((current) => ({
      ...current,
      guestId,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone ?? "",
    }));
  }

  function populateFormFromReservation(reservation) {
    setEditingReservationId(reservation.id);
    setIsReservationModalOpen(true);
    setFormState({
      hotelId: reservation.hotelId,
      guestId: reservation.guestId,
      guestName: reservation.guest?.name ?? "",
      guestEmail: reservation.guest?.email ?? "",
      guestPhone: reservation.guest?.phone ?? "",
      source: reservation.source ?? "Front desk",
      status: reservation.status ?? "confirmed",
      roomTypeCode: reservation.roomTypeCode ?? "",
      roomTitle: reservation.roomTitle ?? "",
      assignedRoomId: reservation.assignedRoomId ?? "",
      checkIn: reservation.checkIn ?? "",
      checkOut: reservation.checkOut ?? "",
      adults: reservation.adults ?? 1,
      children: reservation.children ?? 0,
      roomCount: reservation.roomCount ?? 1,
      nightlyRate: reservation.nightlyRate ?? 0,
      totalAmount: reservation.totalAmount ?? 0,
      notes: reservation.notes ?? "",
    });
  }

  function openCreateModal() {
    setEditingReservationId(null);
    setFormState(createReservationFormState(selectedHotelId));
    setIsReservationModalOpen(true);
  }

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleRoomTypeChange(roomTypeCode) {
    const roomType = roomTypeRecords.find((item) => item.code === roomTypeCode);
    setFormState((current) => ({
      ...current,
      roomTypeCode,
      roomTitle: roomType?.title ?? "",
      nightlyRate: roomType?.baseRate ?? current.nightlyRate,
      assignedRoomId: "",
    }));
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    const payload = {
      ...formState,
      hotelId: selectedHotelId,
      adults: Number(formState.adults),
      children: Number(formState.children),
      roomCount: Number(formState.roomCount),
      nightlyRate: Number(formState.nightlyRate),
      totalAmount: Number(formState.totalAmount),
    };

    if (editingReservationId) {
      await editReservation(editingReservationId, payload);
    } else {
      await createReservation(payload);
    }

    resetForm();
  }

  function getReservationActions(reservation) {
    const { status, assignedRoomId } = reservation;

    if (status === "pending") {
      return [
        { label: "Confirm", nextStatus: "confirmed", buttonClassName: "btn-primary" },
        { label: "Cancel", nextStatus: "cancelled", buttonClassName: "btn-danger light" },
      ];
    }

    if (status === "confirmed") {
      return [
        {
          label: "Check in",
          nextStatus: "checked_in",
          buttonClassName: "btn-success",
          disabled: !assignedRoomId,
          disabledReason: "Assign a room before check-in.",
        },
        { label: "Cancel", nextStatus: "cancelled", buttonClassName: "btn-danger light" },
      ];
    }

    if (status === "checked_in") {
      return [{ label: "Check out", nextStatus: "checked_out", buttonClassName: "btn-secondary" }];
    }

    return [];
  }

  if (loadState.status === "loading") {
    return <div className="alert alert-info">Loading reservations...</div>;
  }

  if (loadState.status === "error") {
    return <div className="alert alert-warning">{loadState.error || "Reservations could not be loaded right now."}</div>;
  }

  return (
    <div className="card rj-operations-page rj-reservations-page">
      <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between gap-3">
        <div>
          <h4 className="card-title mb-1">Reservations</h4>
          <p className="mb-0">Create and manage reservations, room assignments, and stay progress from one place.</p>
        </div>
        <div className="rj-reservations-toolbar">
          <div className="d-flex gap-2 rj-toolbar">
            <select
              className="form-control rj-filter-control"
              style={{ maxWidth: 220 }}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked in</option>
              <option value="checked_out">Checked out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Add reservation
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="rj-reservations-snapshot">
          <div className="rj-reservations-snapshot-card">
            <span>All records</span>
            <strong>{reservationSnapshot.total}</strong>
          </div>
          <div className="rj-reservations-snapshot-card">
            <span>Pending</span>
            <strong>{reservationSnapshot.pending}</strong>
          </div>
          <div className="rj-reservations-snapshot-card">
            <span>Confirmed</span>
            <strong>{reservationSnapshot.confirmed}</strong>
          </div>
          <div className="rj-reservations-snapshot-card">
            <span>In house</span>
            <strong>{reservationSnapshot.inHouse}</strong>
          </div>
        </div>

        {actionState.status === "error" ? <div className="alert alert-warning">{actionState.error}</div> : null}

        {visibleReservations.length === 0 ? (
          <div className="alert alert-secondary mb-0">
            No reservations match this filter yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table card-table default-table rj-reservations-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>Source</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleReservations.map((reservation) => {
                const actions = getReservationActions(reservation);
                const isUpdating = actionState.status === "submitting" && actionState.reservationId === reservation.id;

                return (
                  <tr key={reservation.id}>
                    <td>
                      <strong>{reservation.id}</strong>
                      <div className="text-muted">{reservation.createdAt?.slice(0, 10)}</div>
                    </td>
                    <td>
                      <strong>{reservation.guest?.name}</strong>
                      <div className="text-muted">{reservation.guest?.email}</div>
                    </td>
                    <td>
                      <strong>{reservation.checkIn}</strong>
                      <div className="text-muted">{reservation.checkOut}</div>
                    </td>
                    <td>{reservation.source}</td>
                    <td>
                      <strong>{reservation.roomTitle}</strong>
                      <div className="text-muted">{reservation.room?.roomCode ?? "Unassigned"}</div>
                      <select
                        className="form-control form-control-sm mt-2 rj-inline-select"
                        value={reservation.assignedRoomId ?? ""}
                        disabled={isUpdating}
                        onChange={(event) => {
                          if (event.target.value) {
                            assignReservationRoom(reservation.id, event.target.value);
                          }
                        }}
                      >
                        <option value="">Assign room</option>
                        {(assignableRoomsByReservationId[reservation.id] ?? []).map((room) => (
                          <option key={room.id} value={room.id}>
                            {`${room.roomCode} • ${room.roomType}`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge light rj-status-badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                        {formatStatusLabel(reservation.status)}
                      </span>
                    </td>
                    <td>{formatCurrency(reservation.totalAmount)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2 rj-action-group rj-action-group--compact">
                        <button type="button" className="btn btn-sm btn-info light" onClick={() => populateFormFromReservation(reservation)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteReservation(reservation.id)}
                          disabled={isUpdating}
                        >
                          Delete
                        </button>
                        {actions.map((action) => (
                          <button
                            key={action.nextStatus}
                            type="button"
                            className={`btn btn-sm ${action.buttonClassName}`}
                            disabled={isUpdating || action.disabled}
                            title={action.disabledReason ?? ""}
                            onClick={() => updateReservationLifecycle(reservation.id, action.nextStatus)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal show={isReservationModalOpen} onHide={resetForm} size="lg" centered dialogClassName="rj-operations-modal">
        <form onSubmit={handleFormSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingReservationId ? "Edit reservation" : "Add reservation"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Existing guest</label>
                <select
                  className="form-control"
                  value={formState.guestId}
                  onChange={(event) => populateFormFromGuest(event.target.value)}
                >
                  <option value="">Choose guest</option>
                  {guestRecords.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Guest name</label>
                <input className="form-control" value={formState.guestName} onChange={(event) => updateField("guestName", event.target.value)} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Guest email</label>
                <input type="email" className="form-control" value={formState.guestEmail} onChange={(event) => updateField("guestEmail", event.target.value)} required />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Phone</label>
                <input className="form-control" value={formState.guestPhone} onChange={(event) => updateField("guestPhone", event.target.value)} />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Source</label>
                <input className="form-control" value={formState.source} onChange={(event) => updateField("source", event.target.value)} />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Status</label>
                <select className="form-control" value={formState.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked in</option>
                  <option value="checked_out">Checked out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Room type</label>
                <select className="form-control" value={formState.roomTypeCode} onChange={(event) => handleRoomTypeChange(event.target.value)} required>
                  <option value="">Choose room type</option>
                  {roomTypeOptions.map((roomType) => (
                    <option key={roomType.value} value={roomType.value}>
                      {roomType.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Assign room</label>
                <select className="form-control" value={formState.assignedRoomId} onChange={(event) => updateField("assignedRoomId", event.target.value)}>
                  <option value="">Leave unassigned</option>
                  {assignableRoomsForForm.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Check in</label>
                <input type="date" className="form-control" value={formState.checkIn} onChange={(event) => updateField("checkIn", event.target.value)} required />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Check out</label>
                <input type="date" className="form-control" value={formState.checkOut} onChange={(event) => updateField("checkOut", event.target.value)} required />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Adults</label>
                <input type="number" min="1" className="form-control" value={formState.adults} onChange={(event) => updateField("adults", event.target.value)} />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Children</label>
                <input type="number" min="0" className="form-control" value={formState.children} onChange={(event) => updateField("children", event.target.value)} />
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Rooms</label>
                <input type="number" min="1" className="form-control" value={formState.roomCount} onChange={(event) => updateField("roomCount", event.target.value)} />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Nightly rate</label>
                <input type="number" min="0" className="form-control" value={formState.nightlyRate} onChange={(event) => updateField("nightlyRate", event.target.value)} />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Total amount</label>
                <input type="number" min="0" className="form-control" value={formState.totalAmount} onChange={(event) => updateField("totalAmount", event.target.value)} />
              </div>
              <div className="col-md-12 mb-0">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="3" value={formState.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-light" onClick={resetForm}>
              Close
            </button>
            <button type="submit" className="btn btn-primary">
              {editingReservationId ? "Save reservation" : "Create reservation"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}
