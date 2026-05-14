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

function formatShortDate(value) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getReservationStatusBadgeClass(status) {
  if (status === "pending") return "rj-status-badge--pending";
  if (status === "confirmed") return "rj-status-badge--confirmed";
  if (status === "checked_in") return "rj-status-badge--inhouse";
  return "rj-status-badge--neutral";
}

function MetricIcon({ type }) {
  const iconMap = {
    reservations: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" />
      </svg>
    ),
    arrivals: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h14" />
        <path d="M13 7l5 5-5 5" />
        <path d="M4 6v12" />
      </svg>
    ),
    inhouse: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20V10.5L12 4l8 6.5V20" />
        <path d="M9 20v-5h6v5" />
      </svg>
    ),
    pending: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.8v4.8l3.2 1.9" />
      </svg>
    ),
  };

  return <span className="rj-dashboard-icon">{iconMap[type]}</span>;
}

const metricCards = [
  { key: "totalReservations", label: "Reservations", helper: "All tracked stays", icon: "reservations" },
  { key: "arrivalsToday", label: "Arrivals today", helper: "Expected today", icon: "arrivals" },
  { key: "inHouse", label: "In house", helper: "Currently checked in", icon: "inhouse" },
  { key: "pendingReservations", label: "Pending action", helper: "Need review or follow-up", icon: "pending" },
];

export default function OperationsDashboard() {
  const {
    dashboardMetrics,
    loadState,
    reservationRecords,
    roomRecords,
    selectedHotel,
    unassignedArrivalRecords,
  } = useHotelContext();

  if (loadState.status === "loading") {
    return <div className="alert alert-info">Preparing your hotel dashboard...</div>;
  }

  if (loadState.status === "error") {
    return <div className="alert alert-warning">{loadState.error || "The dashboard could not be loaded right now."}</div>;
  }

  if (!selectedHotel?.id) {
    return <div className="alert alert-secondary">No hotel has been assigned to this account yet.</div>;
  }

  const upcomingReservations = reservationRecords
    .filter((reservation) => reservation.status === "confirmed" || reservation.status === "pending")
    .sort((left, right) => left.checkIn.localeCompare(right.checkIn))
    .slice(0, 6);

  const roomMix = roomRecords.reduce((accumulator, room) => {
    accumulator[room.roomType] = (accumulator[room.roomType] ?? 0) + 1;
    return accumulator;
  }, {});

  const occupancyRate = roomRecords.length
    ? Math.round((dashboardMetrics.occupiedRooms / roomRecords.length) * 100)
    : 0;

  const arrivalSeriesMap = upcomingReservations.reduce((accumulator, reservation) => {
    const current = accumulator.get(reservation.checkIn) ?? 0;
    accumulator.set(reservation.checkIn, current + 1);
    return accumulator;
  }, new Map());

  const arrivalSeries = Array.from(arrivalSeriesMap.entries())
    .slice(0, 7)
    .map(([date, count]) => ({ date, count }));

  const highestArrivalCount = Math.max(...arrivalSeries.map((item) => item.count), 1);

  const recentActivity = reservationRecords
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5)
    .map((reservation) => ({
      id: reservation.id,
      title: reservation.guest?.name || "Guest pending",
      detail: `${formatStatusLabel(reservation.status)} for ${reservation.room?.roomType ?? reservation.roomTitle}`,
      timestamp: formatDateTime(reservation.createdAt),
      status: reservation.status,
    }));

  return (
    <div className="rj-operations-page rj-dashboard-page">
      <div className="rj-dashboard-shell">
        <div className="rj-dashboard-heading">
          <div>
            <span className="rj-dashboard-kicker">Operations Overview</span>
            <h2 className="rj-dashboard-title">{selectedHotel.name}</h2>
            <p className="rj-dashboard-copy">
              A quieter front-desk view of arrivals, occupancy, and reservation movement for {selectedHotel.city}, {selectedHotel.country}.
            </p>
          </div>
        </div>

        <div className="row">
          {metricCards.map((card) => (
            <div className="col-xl-3 col-sm-6 mb-4" key={card.key}>
              <div className="card rj-dashboard-metric-card">
                <div className="card-body">
                  <div className="rj-dashboard-metric-top">
                    <span className="rj-dashboard-metric-label">{card.label}</span>
                    <MetricIcon type={card.icon} />
                  </div>
                  <h3 className="rj-dashboard-metric-value">{dashboardMetrics[card.key]}</h3>
                  <p className="rj-dashboard-metric-helper mb-0">{card.helper}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <div className="col-xl-8 mb-4">
            <div className="card rj-dashboard-panel">
              <div className="card-header border-0">
                <div>
                  <h4 className="card-title mb-1">Booking Rhythm</h4>
                  <p className="mb-0">A small operational read on upcoming arrival volume and room posture.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-6 mb-4 mb-lg-0">
                    <div className="rj-dashboard-block">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="rj-dashboard-block-label">Upcoming arrivals</span>
                        <small className="text-muted">{arrivalSeries.reduce((sum, item) => sum + item.count, 0)} bookings</small>
                      </div>
                      <div className="rj-dashboard-chart">
                        {arrivalSeries.length ? (
                          arrivalSeries.map((item) => (
                            <div className="rj-dashboard-chart-col" key={item.date}>
                              <div
                                className="rj-dashboard-chart-bar"
                                style={{ height: `${Math.max(18, Math.round((item.count / highestArrivalCount) * 100))}%` }}
                              />
                              <span>{formatShortDate(item.date)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted">No arrival activity is scheduled yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="rj-dashboard-block">
                      <span className="rj-dashboard-block-label">Occupancy</span>
                      <div className="rj-dashboard-occupancy-row">
                        <h2 className="mb-0">{occupancyRate}%</h2>
                        <span>{dashboardMetrics.occupiedRooms} of {roomRecords.length} rooms occupied</span>
                      </div>
                      <div className="rj-dashboard-progress">
                        <div className="rj-dashboard-progress-bar" style={{ width: `${occupancyRate}%` }} />
                      </div>

                      <div className="rj-dashboard-mini-grid">
                        <div className="rj-dashboard-mini-stat">
                          <span>Available</span>
                          <strong>{dashboardMetrics.availableRooms}</strong>
                        </div>
                        <div className="rj-dashboard-mini-stat">
                          <span>Unassigned today</span>
                          <strong>{dashboardMetrics.unassignedArrivalsToday}</strong>
                        </div>
                        <div className="rj-dashboard-mini-stat">
                          <span>Tomorrow</span>
                          <strong>{dashboardMetrics.unassignedArrivalsTomorrow}</strong>
                        </div>
                        <div className="rj-dashboard-mini-stat">
                          <span>Revenue</span>
                          <strong>{formatCurrency(dashboardMetrics.upcomingRevenue)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rj-dashboard-divider" />

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="rj-dashboard-block-label mb-0">Room mix</span>
                    <small className="text-muted">{roomRecords.length} tracked rooms</small>
                  </div>
                  <div className="row">
                    {Object.entries(roomMix).map(([roomType, count]) => (
                      <div className="col-sm-6 col-xl-4 mb-3" key={roomType}>
                        <div className="rj-dashboard-list-card">
                          <strong>{roomType}</strong>
                          <span>{count} room{count === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 mb-4">
            <div className="card rj-dashboard-panel">
              <div className="card-header border-0">
                <div>
                  <h4 className="card-title mb-1">Recent Activity</h4>
                  <p className="mb-0">The latest booking movement inside this hotel workspace.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="rj-dashboard-stack">
                  {recentActivity.length ? (
                    recentActivity.map((item) => (
                      <div className="rj-dashboard-activity-item" key={item.id}>
                        <div className="rj-dashboard-activity-copy">
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <div className="rj-dashboard-activity-meta">
                          <span className={`badge light rj-status-badge ${getReservationStatusBadgeClass(item.status)}`}>
                            {formatStatusLabel(item.status)}
                          </span>
                          <small>{item.timestamp}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">No recent reservation activity is available.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card rj-dashboard-panel mt-4">
              <div className="card-header border-0">
                <div>
                  <h4 className="card-title mb-1">Needs Attention</h4>
                  <p className="mb-0">Unassigned arrivals and pending activity.</p>
                </div>
              </div>
              <div className="card-body">
                {unassignedArrivalRecords.length ? (
                  <div className="rj-dashboard-stack">
                    {unassignedArrivalRecords.slice(0, 4).map((reservation) => (
                      <div className="rj-dashboard-alert-item" key={reservation.id}>
                        <div>
                          <strong>{reservation.guest?.name || "Guest pending"}</strong>
                          <div className="text-muted">{formatShortDate(reservation.checkIn)} to {formatShortDate(reservation.checkOut)}</div>
                        </div>
                        <span className="badge light rj-status-badge rj-status-badge--pending">Assign room</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">No unassigned arrivals need attention right now.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-8 mb-4">
            <div className="card rj-dashboard-panel">
              <div className="card-header border-0">
                <div>
                  <h4 className="card-title mb-1">Upcoming Arrivals</h4>
                  <p className="mb-0">The next guests expected to arrive.</p>
                </div>
              </div>
              <div className="card-body">
                {upcomingReservations.length ? (
                  <div className="table-responsive">
                    <table className="table rj-dashboard-table">
                      <thead>
                        <tr>
                          <th>Guest</th>
                          <th>Stay</th>
                          <th>Room type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingReservations.map((reservation) => (
                          <tr key={reservation.id}>
                            <td>
                              <strong>{reservation.guest?.name || "Guest pending"}</strong>
                              <div className="text-muted">{reservation.guest?.email || "No email captured"}</div>
                            </td>
                            <td>
                              <strong>{formatShortDate(reservation.checkIn)}</strong>
                              <div className="text-muted">{formatShortDate(reservation.checkOut)}</div>
                            </td>
                            <td>{reservation.room?.roomType ?? reservation.roomTitle}</td>
                            <td>
                              <span className={`badge light rj-status-badge ${getReservationStatusBadgeClass(reservation.status)}`}>
                                {formatStatusLabel(reservation.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted">No upcoming arrivals are scheduled.</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-4 mb-4">
            <div className="card rj-dashboard-panel">
              <div className="card-header border-0">
                <div>
                  <h4 className="card-title mb-1">Quick Notes</h4>
                  <p className="mb-0">A simple summary for the front desk.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="rj-dashboard-stack">
                  <div className="rj-dashboard-note">
                    <span className="rj-dashboard-note-label">Arrivals today</span>
                    <strong>{dashboardMetrics.arrivalsToday} expected</strong>
                  </div>
                  <div className="rj-dashboard-note">
                    <span className="rj-dashboard-note-label">Confirmed revenue</span>
                    <strong>{formatCurrency(dashboardMetrics.upcomingRevenue)}</strong>
                  </div>
                  <div className="rj-dashboard-note">
                    <span className="rj-dashboard-note-label">Reservation pipeline</span>
                    <strong>{dashboardMetrics.totalReservations} total records</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
