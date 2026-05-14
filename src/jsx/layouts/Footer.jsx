 import React from "react";
import { useHotelContext } from "../../context/HotelContext";

const Footer = () => {
  var d = new Date();
  const { organization, selectedHotel } = useHotelContext();
  return (
    <div className="footer">
      <div className="copyright">
        <p>
          {(organization.brandName || organization.name || "Hotel")} admin for {selectedHotel.name || "your property"} © {d.getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Footer;
