import { useEffect, useMemo, useState } from "react";
import { useHotelContext } from "../../../context/HotelContext";
import { getBrandingInitials } from "../../../lib/adminBranding";

const EMPTY_BRANDING_FORM = {
  brandName: "",
  adminSubtitle: "",
  logoUrl: "",
  primaryColor: "#bc9a70",
  accentColor: "#221d18",
  supportEmail: "",
  supportPhone: "",
};

const EMPTY_HOTEL_FORM = {
  name: "",
  shortName: "",
  code: "",
  city: "",
  country: "Jamaica",
  websiteLabel: "",
  websiteUrl: "",
  timezone: "America/Jamaica",
  description: "",
  contactPhone: "",
  contactEmail: "",
};

function slugifyHotelCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CompanyPage() {
  const {
    organization,
    hotels,
    selectedHotel,
    selectedHotelId,
    setSelectedHotelId,
    updateOrganizationBranding,
    createHotelForOrganization,
    actionState,
    permissions,
  } = useHotelContext();

  const [brandingForm, setBrandingForm] = useState(EMPTY_BRANDING_FORM);
  const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL_FORM);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    setBrandingForm({
      brandName: organization.brandName ?? organization.name ?? "",
      adminSubtitle: organization.adminSubtitle ?? "",
      logoUrl: organization.logoUrl ?? "",
      primaryColor: organization.primaryColor || "#bc9a70",
      accentColor: organization.accentColor || "#221d18",
      supportEmail: organization.supportEmail ?? selectedHotel.contactEmail ?? "",
      supportPhone: organization.supportPhone ?? selectedHotel.contactPhone ?? "",
    });
  }, [organization, selectedHotel]);

  const propertyCountLabel = useMemo(() => `${hotels.length} hotel${hotels.length === 1 ? "" : "s"}`, [hotels.length]);

  if (!permissions.canManageCompany) {
    return null;
  }

  async function handleBrandingSubmit(event) {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    try {
      await updateOrganizationBranding({
        organizationId: organization.id,
        ...brandingForm,
      });
      setFeedback({ type: "success", message: "Company branding updated." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.message ?? "We could not save the company settings." });
    }
  }

  async function handleCreateHotel(event) {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    try {
      await createHotelForOrganization({
        organizationId: organization.id,
        ...hotelForm,
        code: slugifyHotelCode(hotelForm.code),
      });
      setHotelForm(EMPTY_HOTEL_FORM);
      setFeedback({ type: "success", message: "Hotel added to the company." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.message ?? "We could not add the hotel." });
    }
  }

  return (
    <div className="rj-operations-page rj-company-page">
      <div className="row">
        <div className="col-xl-4 mb-4">
          <div className="card h-100 rj-company-overview-card">
            <div className="card-body">
              <span className="rj-company-kicker">Owner workspace</span>
              <h2 className="rj-company-title">{brandingForm.brandName || organization.name || "Company"}</h2>
              <p className="rj-company-copy">
                Manage the admin brand, contact details, and hotel portfolio for this company.
              </p>

              <div className="rj-company-preview" style={{ "--company-primary": brandingForm.primaryColor, "--company-accent": brandingForm.accentColor }}>
                <div className="rj-company-preview-mark">
                  {brandingForm.logoUrl ? (
                    <img src={brandingForm.logoUrl} alt={`${brandingForm.brandName || organization.name} logo`} />
                  ) : (
                    <span>{getBrandingInitials(brandingForm)}</span>
                  )}
                </div>
                <div>
                  <strong>{brandingForm.brandName || organization.name}</strong>
                  <small>{brandingForm.adminSubtitle || "Admin Dashboard"}</small>
                </div>
              </div>

              <div className="rj-company-stat-list mt-4">
                <div className="rj-company-stat-item">
                  <span>Hotels</span>
                  <strong>{propertyCountLabel}</strong>
                </div>
                <div className="rj-company-stat-item">
                  <span>Support email</span>
                  <strong>{brandingForm.supportEmail || "Not set"}</strong>
                </div>
                <div className="rj-company-stat-item">
                  <span>Primary phone</span>
                  <strong>{brandingForm.supportPhone || "Not set"}</strong>
                </div>
              </div>

              {feedback.message ? (
                <div className={`alert mt-4 ${feedback.type === "error" ? "alert-warning" : "alert-info"}`}>
                  {feedback.message}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-xl-8 mb-4">
          <div className="card rj-company-panel">
            <div className="card-header border-0">
              <div>
                <h4 className="card-title mb-1">Company branding</h4>
                <p className="mb-0">These settings control the admin shell, login screen, and browser title.</p>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleBrandingSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Brand name</label>
                    <input
                      className="form-control"
                      value={brandingForm.brandName}
                      onChange={(event) => setBrandingForm((current) => ({ ...current, brandName: event.target.value }))}
                      placeholder="Royale Jazz"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Admin subtitle</label>
                    <input
                      className="form-control"
                      value={brandingForm.adminSubtitle}
                      onChange={(event) => setBrandingForm((current) => ({ ...current, adminSubtitle: event.target.value }))}
                      placeholder="Admin Dashboard"
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Logo URL</label>
                    <input
                      className="form-control"
                      value={brandingForm.logoUrl}
                      onChange={(event) => setBrandingForm((current) => ({ ...current, logoUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Primary color</label>
                    <div className="rj-color-field">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={brandingForm.primaryColor}
                        onChange={(event) => setBrandingForm((current) => ({ ...current, primaryColor: event.target.value }))}
                      />
                      <input
                        className="form-control"
                        value={brandingForm.primaryColor}
                        onChange={(event) => setBrandingForm((current) => ({ ...current, primaryColor: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Accent color</label>
                    <div className="rj-color-field">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={brandingForm.accentColor}
                        onChange={(event) => setBrandingForm((current) => ({ ...current, accentColor: event.target.value }))}
                      />
                      <input
                        className="form-control"
                        value={brandingForm.accentColor}
                        onChange={(event) => setBrandingForm((current) => ({ ...current, accentColor: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Support email</label>
                    <input
                      className="form-control"
                      value={brandingForm.supportEmail}
                      onChange={(event) => setBrandingForm((current) => ({ ...current, supportEmail: event.target.value }))}
                      placeholder="ops@company.com"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Support phone</label>
                    <input
                      className="form-control"
                      value={brandingForm.supportPhone}
                      onChange={(event) => setBrandingForm((current) => ({ ...current, supportPhone: event.target.value }))}
                      placeholder="876-..."
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-2">
                  <button type="submit" className="btn btn-primary" disabled={actionState.status === "submitting"}>
                    Save company settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xl-7 mb-4">
          <div className="card rj-company-panel">
            <div className="card-header border-0">
              <div>
                <h4 className="card-title mb-1">Hotels</h4>
                <p className="mb-0">Switch between active hotels or review what belongs to this company.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                {hotels.map((hotel) => {
                  const isActive = hotel.id === selectedHotelId;

                  return (
                    <div className="col-lg-6 mb-3" key={hotel.id}>
                      <div className={`rj-property-card h-100 ${isActive ? "rj-property-card--active" : ""}`}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="mb-1">{hotel.name}</h5>
                            <div className="text-muted">{hotel.city}, {hotel.country}</div>
                          </div>
                          <span className={`badge light ${isActive ? "badge-primary" : "badge-secondary"}`}>
                            {isActive ? "Selected" : hotel.code}
                          </span>
                        </div>
                        <p className="mb-3">{hotel.description || "No hotel description yet."}</p>
                        <div className="rj-company-hotel-meta">
                          <span>{hotel.websiteUrl || "No website yet"}</span>
                          <span>{hotel.timezone || "Timezone pending"}</span>
                        </div>
                        <button className="btn btn-outline-primary mt-3" onClick={() => setSelectedHotelId(hotel.id)}>
                          {isActive ? "Current hotel" : "Open this hotel"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-5 mb-4">
          <div className="card rj-company-panel">
            <div className="card-header border-0">
              <div>
                <h4 className="card-title mb-1">Add a hotel</h4>
                <p className="mb-0">Owners can add another hotel into this company and start configuring it immediately.</p>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateHotel}>
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">Hotel name</label>
                    <input
                      className="form-control"
                      value={hotelForm.name}
                      onChange={(event) => setHotelForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Royale Jazz Montego Bay"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Short name</label>
                    <input
                      className="form-control"
                      value={hotelForm.shortName}
                      onChange={(event) => setHotelForm((current) => ({ ...current, shortName: event.target.value }))}
                      placeholder="Royale Jazz"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Code</label>
                    <input
                      className="form-control"
                      value={hotelForm.code}
                      onChange={(event) => setHotelForm((current) => ({ ...current, code: slugifyHotelCode(event.target.value) }))}
                      placeholder="RJH-MBJ"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={hotelForm.city}
                      onChange={(event) => setHotelForm((current) => ({ ...current, city: event.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      value={hotelForm.country}
                      onChange={(event) => setHotelForm((current) => ({ ...current, country: event.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Website label</label>
                    <input
                      className="form-control"
                      value={hotelForm.websiteLabel}
                      onChange={(event) => setHotelForm((current) => ({ ...current, websiteLabel: event.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Website URL</label>
                    <input
                      className="form-control"
                      value={hotelForm.websiteUrl}
                      onChange={(event) => setHotelForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Timezone</label>
                    <input
                      className="form-control"
                      value={hotelForm.timezone}
                      onChange={(event) => setHotelForm((current) => ({ ...current, timezone: event.target.value }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact phone</label>
                    <input
                      className="form-control"
                      value={hotelForm.contactPhone}
                      onChange={(event) => setHotelForm((current) => ({ ...current, contactPhone: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Contact email</label>
                    <input
                      className="form-control"
                      value={hotelForm.contactEmail}
                      onChange={(event) => setHotelForm((current) => ({ ...current, contactEmail: event.target.value }))}
                    />
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={hotelForm.description}
                      onChange={(event) => setHotelForm((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary" disabled={actionState.status === "submitting"}>
                    Add hotel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
