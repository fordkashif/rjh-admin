import React, { Fragment, useContext } from "react";
import { useDispatch , useSelector } from 'react-redux';
/// React router dom
import { Link } from "react-router-dom";
import { navtoggle } from "../../../store/actions/AuthActions";

import { ThemeContext } from "../../../context/ThemeContext";
import { useHotelContext } from "../../../context/HotelContext";


const NavHader = () => {
  const { organization } = useHotelContext();
  const dispatch = useDispatch();
   const sideMenu = useSelector(state => state.sideMenu);
   const handleToogle = () => {
     dispatch(navtoggle());
   };
  const { openMenuToggle } = useContext(ThemeContext);
  return (
    <div className="nav-header">
      <Link to="/" className="brand-logo">
        <Fragment>
          {organization.logoUrl ? (
            <span className="royale-jazz-admin-brand-mark" aria-hidden="true">
              <img src={organization.logoUrl} alt={`${organization.brandName || organization.name} logo`} />
            </span>
          ) : null}
          <span className="royale-jazz-admin-brand-copy">
            <span className="royale-jazz-admin-brand-title">{organization.brandName || organization.name || "Admin"}</span>
            <span className="royale-jazz-admin-brand-subtitle">{organization.adminSubtitle || "Admin Dashboard"}</span>
          </span>
        </Fragment>
      </Link>

      <div
        className="nav-control"
        onClick={() => {
        //   setToggle(!toggle);
		handleToogle()
          openMenuToggle();
        }}
      >
        <div className={`hamburger ${sideMenu ? "is-active" : ""}`}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>
    </div>
  );
};

export default NavHader;
