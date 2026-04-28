 import React from "react";
import { useHotelContext } from "../../context/HotelContext";

const Footer = () => {
  var d = new Date();
  const { organization, selectedHotel } = useHotelContext();
  return (
    <div className="footer">
      <div className="copyright">
        <p>
          {organization.name} admin for {selectedHotel.name} © {d.getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Footer;
