import { useEffect, useMemo, useState } from "react";
import { useHotelContext } from "../../../context/HotelContext";
import {
  grantHotelStaffAccess,
  listHotelStaffAccess,
  revokeHotelStaffAccess,
} from "../../../services/staffAccessService";

const roleOptions = [
  { value: "manager", label: "Manager" },
  { value: "front_desk", label: "Front Desk" },
  { value: "owner", label: "Owner" },
];

function formatRole(role) {
  return role.replaceAll("_", " ");
}

export default function StaffAccessPage() {
  const { selectedHotel, loadState } = useHotelContext();
  const [staffState, setStaffState] = useState({
    status: "idle",
    records: [],
    error: "",
  });
  const [submitState, setSubmitState] = useState({
    status: "idle",
    error: "",
    targetUserId: null,
  });
  const [formState, setFormState] = useState({
    email: "",
    role: "manager",
  });

  useEffect(() => {
    let isActive = true;

    async function loadStaffAccess() {
      setStaffState((current) => ({
        ...current,
        status: "loading",
        error: "",
      }));

      try {
        const records = await listHotelStaffAccess(selectedHotel.id);

        if (!isActive) {
          return;
        }

        setStaffState({
          status: "ready",
          records,
          error: "",
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStaffState({
          status: "error",
          records: [],
          error: error?.message ?? "We could not load hotel staff access right now.",
        });
      }
    }

    loadStaffAccess();

    return () => {
      isActive = false;
    };
  }, [selectedHotel.id]);

  const roleBreakdown = useMemo(
    () =>
      staffState.records.reduce((accumulator, record) => {
        accumulator[record.role] = (accumulator[record.role] ?? 0) + 1;
        return accumulator;
      }, {}),
    [staffState.records],
  );

  async function refreshStaffAccess() {
    const records = await listHotelStaffAccess(selectedHotel.id);
    setStaffState({
      status: "ready",
      records,
      error: "",
    });
  }

  async function handleGrantAccess(event) {
    event.preventDefault();
    setSubmitState({ status: "submitting", error: "", targetUserId: null });

    try {
      await grantHotelStaffAccess({
        hotelId: selectedHotel.id,
        email: formState.email.trim(),
        role: formState.role,
      });
      setFormState({ email: "", role: "manager" });
      await refreshStaffAccess();
      setSubmitState({ status: "success", error: "", targetUserId: null });
    } catch (error) {
      setSubmitState({
        status: "error",
        error: error?.message ?? "We could not grant hotel access.",
        targetUserId: null,
      });
    }
  }

  async function handleRevokeAccess(userId) {
    setSubmitState({ status: "submitting", error: "", targetUserId: userId });

    try {
      await revokeHotelStaffAccess({
        hotelId: selectedHotel.id,
        userId,
      });
      await refreshStaffAccess();
      setSubmitState({ status: "success", error: "", targetUserId: null });
    } catch (error) {
      setSubmitState({
        status: "error",
        error: error?.message ?? "We could not revoke hotel access.",
        targetUserId: userId,
      });
    }
  }

  return (
    <div className="card">
      <div className="card-header border-0 pb-0">
        <div>
          <h4 className="card-title mb-1">Staff Access</h4>
          <p className="mb-0">
            Manage who can operate <strong>{selectedHotel.name}</strong> without going back to SQL.
          </p>
        </div>
      </div>
      <div className="card-body">
        {loadState.source !== "supabase" ? (
          <div className="alert alert-warning">
            Staff access management requires live Supabase data and authenticated admin access.
          </div>
        ) : null}
        {staffState.status === "error" ? (
          <div className="alert alert-warning">{staffState.error}</div>
        ) : null}
        {submitState.status === "error" ? (
          <div className="alert alert-warning">{submitState.error}</div>
        ) : null}

        <div className="row">
          <div className="col-xl-5 mb-4">
            <div className="border rounded p-4 h-100">
              <h5 className="mb-3">Grant Hotel Access</h5>
              <p className="text-muted">
                The user must already exist in Supabase Auth before they can be assigned here.
              </p>

              <form onSubmit={handleGrantAccess}>
                <div className="form-group mb-3">
                  <label className="mb-2"><strong>Staff Email</strong></label>
                  <input
                    type="email"
                    className="form-control"
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                    placeholder="staff@example.com"
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label className="mb-2"><strong>Role</strong></label>
                  <select
                    className="form-control"
                    value={formState.role}
                    onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value }))}
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitState.status === "submitting"}
                >
                  {submitState.status === "submitting" && !submitState.targetUserId ? "Saving..." : "Grant access"}
                </button>
              </form>
            </div>
          </div>

          <div className="col-xl-7 mb-4">
            <div className="border rounded p-4 h-100">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                <div>
                  <h5 className="mb-1">Current Staff Access</h5>
                  <p className="text-muted mb-0">
                    {staffState.records.length} staff account{staffState.records.length === 1 ? "" : "s"} can currently manage this hotel.
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {Object.entries(roleBreakdown).map(([role, count]) => (
                    <span className="badge light badge-primary" key={role}>
                      {`${count} ${formatRole(role)}`}
                    </span>
                  ))}
                </div>
              </div>

              {staffState.status === "loading" ? (
                <div className="alert alert-info mb-0">Loading staff access...</div>
              ) : staffState.records.length === 0 ? (
                <div className="alert alert-secondary mb-0">
                  No staff accounts are assigned to this hotel yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table card-table default-table mb-0">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Granted</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffState.records.map((record) => {
                        const isTarget =
                          submitState.status === "submitting" && submitState.targetUserId === record.user_id;

                        return (
                          <tr key={record.user_id}>
                            <td>
                              <strong>{record.email}</strong>
                            </td>
                            <td style={{ textTransform: "capitalize" }}>{formatRole(record.role)}</td>
                            <td>{String(record.created_at).slice(0, 10)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger light"
                                disabled={submitState.status === "submitting"}
                                onClick={() => handleRevokeAccess(record.user_id)}
                              >
                                {isTarget ? "Removing..." : "Remove access"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
