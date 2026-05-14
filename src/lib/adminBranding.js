const BRANDING_STORAGE_KEY = "innap:organizationBranding";

const DEFAULT_BRANDING = {
  organizationId: "royale-jazz",
  companyName: "Royale Jazz",
  brandName: "Royale Jazz",
  adminSubtitle: "Admin Dashboard",
  logoUrl: "",
  primaryColor: "#bc9a70",
  accentColor: "#221d18",
  supportEmail: "",
  supportPhone: "",
};

function clampColorValue(value) {
  return Math.max(0, Math.min(255, value));
}

function normalizeHexColor(value, fallback) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return fallback;
  }

  const normalized = candidate.startsWith("#") ? candidate.slice(1) : candidate;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return fallback;
  }

  return `#${normalized.toLowerCase()}`;
}

function shiftHexColor(hexColor, amount) {
  const normalized = normalizeHexColor(hexColor, DEFAULT_BRANDING.primaryColor).slice(1);
  const next = normalized
    .match(/.{2}/g)
    .map((segment) => clampColorValue(parseInt(segment, 16) + amount))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return `#${next}`;
}

export function buildBrandingSnapshot(organization = {}, hotel = {}) {
  const companyName =
    String(organization.brandName ?? organization.name ?? hotel.shortName ?? hotel.name ?? DEFAULT_BRANDING.companyName).trim() ||
    DEFAULT_BRANDING.companyName;
  const adminSubtitle =
    String(organization.adminSubtitle ?? "").trim() ||
    `${companyName} Admin Dashboard`;

  return {
    organizationId: organization.id ?? DEFAULT_BRANDING.organizationId,
    companyName,
    brandName: companyName,
    adminSubtitle,
    logoUrl: String(organization.logoUrl ?? "").trim(),
    primaryColor: normalizeHexColor(organization.primaryColor, DEFAULT_BRANDING.primaryColor),
    accentColor: normalizeHexColor(organization.accentColor, DEFAULT_BRANDING.accentColor),
    supportEmail: String(organization.supportEmail ?? hotel.contactEmail ?? "").trim(),
    supportPhone: String(organization.supportPhone ?? hotel.contactPhone ?? "").trim(),
  };
}

export function readStoredBranding() {
  if (typeof window === "undefined") {
    return DEFAULT_BRANDING;
  }

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_BRANDING;
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_BRANDING,
      ...parsed,
      primaryColor: normalizeHexColor(parsed?.primaryColor, DEFAULT_BRANDING.primaryColor),
      accentColor: normalizeHexColor(parsed?.accentColor, DEFAULT_BRANDING.accentColor),
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function persistBranding(branding) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    BRANDING_STORAGE_KEY,
    JSON.stringify({
      ...DEFAULT_BRANDING,
      ...branding,
      primaryColor: normalizeHexColor(branding?.primaryColor, DEFAULT_BRANDING.primaryColor),
      accentColor: normalizeHexColor(branding?.accentColor, DEFAULT_BRANDING.accentColor),
    }),
  );
}

export function applyBrandingToDocument(branding) {
  if (typeof document === "undefined") {
    return;
  }

  const body = document.body;
  const normalized = {
    ...DEFAULT_BRANDING,
    ...branding,
    primaryColor: normalizeHexColor(branding?.primaryColor, DEFAULT_BRANDING.primaryColor),
    accentColor: normalizeHexColor(branding?.accentColor, DEFAULT_BRANDING.accentColor),
  };

  body.style.setProperty("--rj-gold", normalized.primaryColor);
  body.style.setProperty("--rj-gold-deep", shiftHexColor(normalized.primaryColor, -28));
  body.style.setProperty("--rj-panel", normalized.accentColor);
  body.style.setProperty("--rj-panel-2", shiftHexColor(normalized.accentColor, 10));
  body.style.setProperty("--rj-line", "rgba(77, 59, 35, 0.12)");

  document.title = `${normalized.companyName} Admin Dashboard`;
}

export function getBrandingInitials(branding) {
  const source = String(branding?.brandName ?? branding?.companyName ?? DEFAULT_BRANDING.companyName).trim();
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("") || "AD";
}

export { BRANDING_STORAGE_KEY, DEFAULT_BRANDING };
