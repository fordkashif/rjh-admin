import React, { useContext } from "react";
import { Dropdown } from "react-bootstrap";
import LogoutPage from "./Logout";
import profile from "../../../assets/images/avatar/pic1.jpg";
import { ThemeContext } from "../../../context/ThemeContext";
import { useHotelContext } from "../../../context/HotelContext";

const pageTitles = {
  "": "Dashboard",
  dashboard: "Dashboard",
  reservations: "Reservations",
  guests: "Guests",
  rooms: "Rooms",
  properties: "Properties",
};

const Header = () => {
  const { background, changeBackground } = useContext(ThemeContext);
  const { hotels, selectedHotel, selectedHotelId, setSelectedHotelId, loadState } = useHotelContext();
  const currentSlug = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const currentTitle = pageTitles[currentSlug] ?? "Dashboard";

  function handleBackground() {
    if (background.value === "light") {
      changeBackground({ value: "dark", label: "Dark" });
    } else {
      changeBackground({ value: "light", label: "Light" });
    }
  }

  return (
    <div className="header">
      <div className="header-content">
        <nav className="navbar navbar-expand">
          <div className="collapse navbar-collapse justify-content-between">
            <div className="header-left">
              <div className="dashboard_bar" style={{ textTransform: "capitalize" }}>
                {currentTitle}
              </div>
            </div>
            <ul className="navbar-nav header-right align-items-center">
              <li className="nav-item me-3">
                <select
                  className="form-control"
                  style={{ minWidth: 220 }}
                  value={selectedHotelId ?? ""}
                  onChange={(event) => setSelectedHotelId(event.target.value)}
                  disabled={loadState.status !== "ready" || hotels.length === 0}
                >
                  {hotels.length === 0 ? <option value="">No hotels assigned</option> : null}
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </li>
              <li className="nav-item dropdown notification_dropdown me-2">
                <button
                  type="button"
                  className={`nav-link bell dz-theme-mode btn btn-link ${background.value === "dark" ? "active" : ""}`}
                  onClick={handleBackground}
                >
                  <i id="icon-light" className="fas fa-sun" />
                  <i id="icon-dark" className="fas fa-moon" />
                </button>
              </li>
              <Dropdown as="li" className="nav-item dropdown header-profile">
                <Dropdown.Toggle variant="" as="a" className="nav-link i-false c-pointer">
                  <img src={profile} width={20} alt="" />
                  <div className="header-info ms-3">
                    <span className="font-w600 ">Hotel Admin</span>
                    <small className="text-end fs-12">{selectedHotel?.shortName}</small>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" className="mt-0 dropdown-menu dropdown-menu-end">
                  <a href={selectedHotel ? `https://${selectedHotel.websiteUrl}` : "#"} className="dropdown-item ai-icon" target="_blank" rel="noreferrer">
                    <svg
                      id="icon-home"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9.5L12 4l9 5.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
                    </svg>
                    <span className="ms-2">View website</span>
                  </a>
                  <div className="dropdown-item">
                    <div>
                      <strong className="d-block">{selectedHotel?.name}</strong>
                      <small>{selectedHotel?.city}, {selectedHotel?.country}</small>
                    </div>
                  </div>
                  <LogoutPage />
                </Dropdown.Menu>
              </Dropdown>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Header;
