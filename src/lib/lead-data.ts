import type { AuditRun, CalibrationAnchor, Lead } from "@/lib/lead-types";
import { normalizeDomain, normalizeName } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

function makeLead(input: Omit<Lead, "id" | "normalized_name" | "canonical_domain" | "collected_at" | "audit_date"> & { collected_at?: string; audit_date?: string }): Lead {
  return {
    ...input,
    id: crypto.randomUUID(),
    normalized_name: normalizeName(input.business_name),
    canonical_domain: normalizeDomain(input.website),
    collected_at: input.collected_at ?? today,
    audit_date: input.audit_date ?? today
  };
}

export const issueCatalog = [
  "no_website_found",
  "outdated_visual_system",
  "missing_project_references",
  "weak_service_pages",
  "no_quote_cta",
  "no_visible_whatsapp",
  "missing_city_service_keywords",
  "missing_certifications",
  "thin_technical_documents",
  "mobile_layout_risk",
  "https_or_tls_issue",
  "load_failure",
  "bot_or_cookie_block",
  "duplicate_chain_domain"
];

export const sectorCategories = [
  "GES / EPC",
  "Electrical Contracting",
  "Industrial Energy Services",
  "Solar Installer",
  "Panel / Inverter Distributor",
  "Generator / UPS",
  "EV Charging Installer"
] as const;

export const turkeyCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Konya", "Antalya", "Gaziantep", "Kayseri"];

export const researchQueries = [
  '"GES EPC" Türkiye firma',
  '"güneş enerji sistemleri" "referanslarımız"',
  '"elektrik taahhüt" "İstanbul"',
  '"EV şarj istasyonu kurulum" firma',
  '"jeneratör UPS" "servis" Türkiye',
  '"inverter distribütörü" Türkiye',
  '"endüstriyel enerji" "bakım" firma',
  '"solar panel bayi" "Türkiye"',
  '"pano trafo taahhüt" "referans"',
  '"şarj istasyonu" "kurulum" "teklif"'
];

export const seedLeads: Lead[] = [
  makeLead({
    business_name: "Akdeniz Solar EPC",
    sector_category: "GES / EPC",
    city: "Antalya",
    district: "Kepez",
    source: "research_queue",
    source_url: "https://www.google.com/search?q=%22GES+EPC%22+Antalya+firma",
    website: "https://akdenizsolarepc.com",
    phone: "+90 242 000 00 00",
    email: "info@akdenizsolarepc.com",
    is_chain: false,
    location_count: 1,
    website_status: "reachable",
    block_subtype: "none",
    lead_segment: "trust_gap",
    design_signal: "yellow",
    seo_signal: "yellow",
    conversion_signal: "yellow",
    technical_signal: "green",
    trust_signal: "red",
    priority: "High",
    issues_found: ["missing_project_references", "missing_certifications", "thin_technical_documents"],
    screenshot_path: "data/screenshots/akdeniz-solar-epc.png",
    calibration_anchor: "Acceptable",
    manual_review_status: "new"
  }),
  makeLead({
    business_name: "Marmara Elektrik Taahhüt",
    sector_category: "Electrical Contracting",
    city: "İstanbul",
    district: "Tuzla",
    source: "directory",
    source_url: "https://example-directory.local/elektrik-taahhut",
    website: "http://marmaraelektriktaahhut.com",
    phone: "+90 216 000 00 00",
    email: "teklif@marmaraelektriktaahhut.com",
    is_chain: false,
    location_count: 1,
    website_status: "reachable",
    block_subtype: "none",
    lead_segment: "redesign",
    design_signal: "red",
    seo_signal: "red",
    conversion_signal: "yellow",
    technical_signal: "yellow",
    trust_signal: "yellow",
    priority: "High",
    issues_found: ["outdated_visual_system", "weak_service_pages", "missing_city_service_keywords"],
    screenshot_path: "data/screenshots/marmara-elektrik-taahhut.png",
    calibration_anchor: "Outdated",
    manual_review_status: "reviewing"
  }),
  makeLead({
    business_name: "Voltaj Jeneratör UPS",
    sector_category: "Generator / UPS",
    city: "Ankara",
    district: "Ostim",
    source: "manual_csv",
    source_url: "manual import",
    website: "",
    phone: "+90 312 000 00 00",
    email: "",
    is_chain: false,
    location_count: 1,
    website_status: "no_website",
    block_subtype: "none",
    lead_segment: "first_site",
    design_signal: "unknown",
    seo_signal: "red",
    conversion_signal: "red",
    technical_signal: "unknown",
    trust_signal: "red",
    priority: "High",
    issues_found: ["no_website_found"],
    screenshot_path: "",
    calibration_anchor: "No website",
    manual_review_status: "new"
  }),
  makeLead({
    business_name: "Eksen Şarj Teknolojileri İstanbul",
    sector_category: "EV Charging Installer",
    city: "İstanbul",
    district: "Ataşehir",
    source: "saved_html",
    source_url: "imports/ev-charging-directory.html",
    website: "https://eksensarj.com",
    phone: "+90 850 000 00 00",
    email: "proje@eksensarj.com",
    is_chain: true,
    location_count: 4,
    website_status: "blocked",
    block_subtype: "cloudflare_challenge",
    lead_segment: "deprioritized",
    design_signal: "unknown",
    seo_signal: "unknown",
    conversion_signal: "unknown",
    technical_signal: "yellow",
    trust_signal: "unknown",
    priority: "Low",
    issues_found: ["bot_or_cookie_block", "duplicate_chain_domain"],
    screenshot_path: "",
    calibration_anchor: "Acceptable",
    manual_review_status: "rejected"
  })
];

export const calibrationAnchors: CalibrationAnchor[] = [
  {
    id: "excellent",
    name: "Reference-grade EPC site",
    label: "Excellent",
    category: "GES / EPC",
    signals: { design: "green", seo: "green", conversion: "green", technical: "green", trust: "green" },
    notes: "Modern service hierarchy, clear project references, certifications, quote path, and city/service coverage."
  },
  {
    id: "acceptable",
    name: "Usable industrial services site",
    label: "Acceptable",
    category: "Industrial Energy Services",
    signals: { design: "yellow", seo: "yellow", conversion: "yellow", technical: "green", trust: "yellow" },
    notes: "Readable and functional, but proof and service pages need sharper structure."
  },
  {
    id: "outdated",
    name: "Legacy contractor site",
    label: "Outdated",
    category: "Electrical Contracting",
    signals: { design: "red", seo: "red", conversion: "yellow", technical: "yellow", trust: "yellow" },
    notes: "Looks old, has thin service pages, but has enough contact information to be recoverable."
  },
  {
    id: "broken",
    name: "Broken or unreachable site",
    label: "Broken",
    category: "Generator / UPS",
    signals: { design: "unknown", seo: "red", conversion: "red", technical: "red", trust: "red" },
    notes: "HTTP, DNS, TLS, or render failure should be separated from bot protection."
  },
  {
    id: "no-website",
    name: "No website found",
    label: "No website",
    category: "EV Charging Installer",
    signals: { design: "unknown", seo: "red", conversion: "red", technical: "unknown", trust: "red" },
    notes: "Strong first-site candidate if the business has visible local activity elsewhere."
  }
];

export const seedAuditRuns: AuditRun[] = [
  {
    id: "run-1",
    date: today,
    source: "Manual seed batch",
    checked: 4,
    reachable: 2,
    broken: 0,
    blocked: 1,
    noWebsite: 1,
    notes: "Initial energy-sector calibration batch. No paid services used."
  }
];
