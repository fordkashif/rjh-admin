import { useHotelContext } from "../../../context/HotelContext";

export default function PropertiesPage() {
  const { hotels, selectedHotelId, setSelectedHotelId, organization } = useHotelContext();

  return (
    <div className="card rj-operations-page rj-properties-page">
      <div className="card-header border-0 pb-0">
        <div>
          <h4 className="card-title mb-1">Properties</h4>
          <p className="mb-0">This layer is ready for multiple hotels later, but right now it is centered on Royale Jazz Hotel.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="row">
          {hotels.map((hotel) => {
            const isActive = hotel.id === selectedHotelId;

            return (
              <div className="col-xl-6 mb-4" key={hotel.id}>
                <div className={`border rounded p-4 h-100 rj-property-card ${isActive ? "border-primary" : ""}`}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="mb-1">{hotel.name}</h4>
                      <div className="text-muted">{hotel.city}, {hotel.country}</div>
                    </div>
                    <span className={`badge light ${isActive ? "badge-primary" : "badge-secondary"}`}>
                      {isActive ? "Active property" : hotel.code}
                    </span>
                  </div>
                  <p>{hotel.description}</p>
                  <div className="mb-2">
                    <strong>Website:</strong> {hotel.websiteUrl}
                  </div>
                  <div className="mb-4">
                    <strong>Timezone:</strong> {hotel.timezone}
                  </div>
                  <button className="btn btn-primary" onClick={() => setSelectedHotelId(hotel.id)}>
                    {isActive ? "Currently selected" : "Switch to this property"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
