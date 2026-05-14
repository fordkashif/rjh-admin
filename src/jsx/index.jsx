import React, { useContext } from "react";

/// React router dom
import {Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { useSelector } from "react-redux";

/// Css
import "./index.css";
import "./chart.css";
import "./step.css";

/// Layout
import Nav from "./layouts/nav";
import Footer from "./layouts/Footer";
import OperationsDashboard from "./components/Operations/Dashboard";
import ReservationsPage from "./components/Operations/Reservations";
import GuestsPage from "./components/Operations/Guests";
import RoomsPage from "./components/Operations/Rooms";
import PropertiesPage from "./components/Operations/Properties";
import StaffAccessPage from "./components/Operations/StaffAccess";
import CompanyPage from "./components/Operations/Company";

/// Pages
import LockScreen from "./pages/LockScreen";
import Error400 from "./pages/Error400";
import Error403 from "./pages/Error403";
import Error404 from "./pages/Error404";
import Error500 from "./pages/Error500";
import Error503 from "./pages/Error503";
import { ThemeContext } from "../context/ThemeContext";
//Scroll To Top
import ScrollToTop from './layouts/ScrollToTop';
import { useHotelContext } from "../context/HotelContext";

function RoleRoute({ allow, children }) {
  const { currentUserRole, loadState } = useHotelContext();

  if (loadState.status === "loading" || loadState.status === "error") {
    return children;
  }

  if (allow && !allow.includes(currentUserRole)) {
    return <Error403 />;
  }

  return children;
}

function DefaultLandingRoute() {
  const { currentUserRole, loadState } = useHotelContext();

  if (loadState.status === "loading") {
    return null;
  }

  if (currentUserRole === "owner") {
    return <Navigate to="/company" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}


const Markup = () => {
  const allroutes = [
    { url: "", component: <DefaultLandingRoute />, allow: ["owner", "manager", "front_desk"] },
    { url: "dashboard", component: <OperationsDashboard />, allow: ["owner", "manager", "front_desk"] },
    { url: "reservations", component: <ReservationsPage />, allow: ["owner", "manager", "front_desk"] },
    { url: "guests", component: <GuestsPage />, allow: ["owner", "manager", "front_desk"] },
    { url: "rooms", component: <RoomsPage />, allow: ["owner", "manager", "front_desk"] },
    { url: "company", component: <CompanyPage />, allow: ["owner"] },
    { url: "properties", component: <PropertiesPage />, allow: ["owner", "manager"] },
    { url: "staff-access", component: <StaffAccessPage />, allow: ["owner"] },
  ];

  return (
    <>
     
        <Routes>
            <Route path='page-lock-screen' element= {<LockScreen />} />
            <Route path='page-error-400' element={<Error400/>} />
            <Route path='page-error-403' element={<Error403/>} />
            <Route path='page-error-404' element={<Error404/>} />
            <Route path='page-error-500' element={<Error500/>} />
            <Route path='page-error-503' element={<Error503/>} />
            <Route  element={<MainLayout />} > 
                {allroutes.map((data, i) => (
                  <Route
                    key={i}
                    exact
                    path={`${data.url}`}
                    element={<RoleRoute allow={data.allow}>{data.component}</RoleRoute>}
                  />
                ))}
            </Route>
          </Routes>        
        <ScrollToTop />
        
    </>
  );
};

function MainLayout(){
  const {sidebariconHover} = useContext(ThemeContext);
  const sideMenu = useSelector(state => state.sideMenu);
  return (
    <>
      <div id="main-wrapper" className={`show ${sidebariconHover ? "iconhover-toggle": ""} ${ sideMenu ? "menu-toggle" : ""}`}>  
        <Nav />
        <div className="content-body" style={{ minHeight: window.screen.height - 60 }}>
            <div className="container-fluid">
              <Outlet />                
            </div>
        </div>
        <Footer />
      </div>
    </>
  )

};

export default Markup
