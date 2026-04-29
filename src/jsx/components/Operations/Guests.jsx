import { useHotelContext } from "../../../context/HotelContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GuestsPage() {
  const { guestRecords, actionState, loadState } = useHotelContext();

  if (loadState.status === "loading") {
    return <div className="alert alert-info">Loading guest history...</div>;
  }

  if (loadState.status === "error") {
    return <div className="alert alert-warning">{loadState.error || "Guest history could not be loaded right now."}</div>;
  }

  return (
    <div className="card">
      <div className="card-header border-0 pb-0">
        <div>
          <h4 className="card-title mb-1">Guest History</h4>
          <p className="mb-0">Every guest record is created from a reservation and helps your team track stay history and preferences.</p>
        </div>
      </div>
      <div className="card-body">
        {actionState.status === "error" ? <div className="alert alert-warning">{actionState.error}</div> : null}

        {guestRecords.length === 0 ? (
          <div className="alert alert-secondary mb-0">
            Guest history will appear here once reservations have been added.
          </div>
        ) : (
          <div className="row">
            {guestRecords.map((guest) => (
              <div className="col-xl-4 col-md-6 mb-4" key={guest.id}>
                <div className="border rounded p-3 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="mb-1">{guest.name}</h4>
                      <div className="text-muted">{guest.email}</div>
                    </div>
                    <span className="badge light badge-primary">{guest.loyaltyTier}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>Phone</span>
                    <strong>{guest.phone || "N/A"}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Channel</span>
                    <strong>{guest.preferredChannel || "Direct"}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Reservations</span>
                    <strong>{guest.reservationCount ?? 0}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total spend</span>
                    <strong>{formatCurrency(guest.totalSpend ?? 0)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Active stay</span>
                    <strong>{guest.activeReservation?.room?.roomCode ?? "None"}</strong>
                  </div>
                  <div className="mt-3 text-muted" style={{ minHeight: 36 }}>
                    {guest.notes || "No notes recorded."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
