import React, { useMemo, useState } from "react";
import { connect, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadingToggleAction, loginAction } from "../../store/actions/AuthActions";
import { readStoredBranding } from "../../lib/adminBranding";

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPreference, setRememberPreference] = useState(true);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const nav = useNavigate();
  const branding = useMemo(() => readStoredBranding(), []);

  function onLogin(event) {
    event.preventDefault();
    const nextErrors = { email: "", password: "" };
    let hasError = false;

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
      hasError = true;
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
      hasError = true;
    }

    setErrors(nextErrors);
    if (hasError) {
      return;
    }

    if (!rememberPreference) {
      window.localStorage.removeItem("userDetails");
    }

    dispatch(loadingToggleAction(true));
    dispatch(loginAction(email, password, nav));
  }

  return (
    <div
      className="rj-login-page"
      style={{
        "--company-primary": branding.primaryColor,
        "--company-accent": branding.accentColor,
      }}
    >
      <div className="rj-login-shell">
        <section className="rj-login-brand-panel">
          <span className="rj-login-kicker">Multi-property operations</span>
          <h1 className="rj-login-title">{branding.brandName || "Hotel Admin"}</h1>
          <p className="rj-login-copy">
            Manage reservations, rooms, guests, and company branding from one calm workspace.
          </p>

          <div className="rj-login-brand-card">
            {branding.logoUrl ? (
              <img
                className="rj-login-brand-logo"
                src={branding.logoUrl}
                alt={`${branding.brandName || branding.companyName} logo`}
              />
            ) : null}
            <div className="rj-login-brand-lockup">
              <div>
                <strong>{branding.brandName || branding.companyName || "Admin Dashboard"}</strong>
                <small>{branding.adminSubtitle || "Operations workspace"}</small>
              </div>
            </div>
            <div className="rj-login-brand-meta">
              <span>{branding.supportEmail || "Branding and contact info update here after owner setup."}</span>
              {branding.supportPhone ? <span>{branding.supportPhone}</span> : null}
            </div>
          </div>
        </section>

        <section className="rj-login-form-panel">
          <div className="rj-login-form-card">
            <div className="rj-login-form-header">
              <h2>Sign in</h2>
              <p>Use your company credentials to enter the admin dashboard.</p>
            </div>

            {props.errorMessage ? <div className="alert alert-warning mb-3">{props.errorMessage}</div> : null}
            {props.successMessage ? <div className="alert alert-info mb-3">{props.successMessage}</div> : null}

            <form onSubmit={onLogin} className="rj-login-form">
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
                {errors.email ? <div className="text-danger fs-12 mt-1">{errors.email}</div> : null}
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                {errors.password ? <div className="text-danger fs-12 mt-1">{errors.password}</div> : null}
              </div>

              <label className="rj-login-checkbox">
                <input
                  type="checkbox"
                  checked={rememberPreference}
                  onChange={(event) => setRememberPreference(event.target.checked)}
                />
                <span>Remember this device</span>
              </label>

              <button type="submit" className="btn btn-primary w-100 mt-4">
                Sign in to dashboard
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

const mapStateToProps = (state) => ({
  errorMessage: state.auth.errorMessage,
  successMessage: state.auth.successMessage,
  showLoading: state.auth.showLoading,
});

export default connect(mapStateToProps)(Login);
