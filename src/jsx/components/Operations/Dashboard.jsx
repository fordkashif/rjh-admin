import { useHotelContext } from "../../../context/HotelContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const metricCards = [
  { key: "totalReservations", label: "Reservations", accent: "gradient-1" },
  { key: "arrivalsToday", label: "Arrivals Today", accent: "gradient-2" },
  { key: "inHouse", label: "In House", accent: "gradient-3" },
  { key: "pendingReservations", label: "Pending Action", accent: "gradient-4" },
];

export default function OperationsDashboard() {
  const { dashboardMetrics, loadState, reservationRecords, roomRecords, selectedHotel } = useHotelContext();

  const upcomingReservations = reservationRecords
    .filter((reservation) => reservation.status === "confirmed" || reservation.status === "pending")
    .sort((left, right) => left.checkIn.localeCompare(right.checkIn))
    .slice(0, 4);

  const roomMix = roomRecords.reduce((accumulator, room) => {
    accumulator[room.roomType] = (accumulator[room.roomType] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <>
      {loadState.status === "loading" ? (
        <div className="alert alert-info">Loading hotel operations data...</div>
      ) : null}
      {loadState.status === "error" ? (
        <div className="alert alert-warning">
          Supabase data could not be loaded, so the admin is using local fallback data for now.
        </div>
      ) : null}
      <div className="row">
        {metricCards.map((card) => (
          <div className="col-xl-3 col-sm-6" key={card.key}>
            <div className={`card ${card.accent} card-bx`}>
              <div className="card-body d-flex align-items-center">
                <div className="me-auto text-white">
                  <h2 className="text-white">{dashboardMetrics[card.key]}</h2>
                  <span className="fs-18">{card.label}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <div>
                <h4 className="card-title mb-1">Property Snapshot</h4>
                <p className="mb-0">
                  {selectedHotel.name} manages direct bookings from {selectedHotel.websiteUrl} and can
                  share the same admin with sister properties.
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="border rounded p-3 h-100">
                    <h5 className="mb-3">Revenue in pipeline</h5>
                    <h2 className="mb-2">{formatCurrency(dashboardMetrics.upcomingRevenue)}</h2>
                    <span className="text-muted">Confirmed and in-house reservation value</span>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="border rounded p-3 h-100">
                    <h5 className="mb-3">Room inventory</h5>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Available</span>
                      <strong>{dashboardMetrics.availableRooms}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Occupied</span>
                      <strong>{dashboardMetrics.occupiedRooms}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Total tracked rooms</span>
                      <strong>{roomRecords.length}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded p-3">
                <h5 className="mb-3">Room mix for this hotel</h5>
                <div className="row">
                  {Object.entries(roomMix).map(([roomType, count]) => (
                    <div className="col-sm-6 col-lg-4 mb-3" key={roomType}>
                      <div className="bg-light rounded p-3 h-100">
                        <strong className="d-block">{roomType}</strong>
                        <span className="text-muted">{count} tracked room{count === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">Upcoming Arrivals</h4>
            </div>
            <div className="card-body">
              {upcomingReservations.length ? (
                upcomingReservations.map((reservation) => (
                  <div className="d-flex align-items-start justify-content-between border-bottom pb-3 mb-3" key={reservation.id}>
                    <div>
                      <h5 className="mb-1">{reservation.guest?.name}</h5>
                      <div className="text-muted">{reservation.room?.roomType}</div>
                      <small>{reservation.checkIn} to {reservation.checkOut}</small>
                    </div>
                    <span className={`badge light ${reservation.status === "pending" ? "badge-warning" : "badge-primary"}`}>
                      {reservation.status.replace("_", " ")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-muted">No upcoming arrivals are currently scheduled.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
