export type TrafficSignal = "red" | "yellow" | "green" | "unknown";
export type Priority = "High" | "Medium" | "Low";
export type WebsiteStatus = "no_website" | "reachable" | "broken" | "blocked" | "unknown";
export type BlockSubtype =
  | "none"
  | "http_404"
  | "http_5xx"
  | "dns_failure"
  | "tls_error"
  | "timeout"
  | "cloudflare_challenge"
  | "bot_protection"
  | "cookie_wall"
  | "requires_javascript"
  | "unknown_block";
export type LeadSegment = "first_site" | "redesign" | "seo_cleanup" | "trust_gap" | "deprioritized";
export type ManualReviewStatus = "new" | "reviewing" | "qualified" | "rejected" | "contacted";

export type SectorCategory =
  | "GES / EPC"
  | "Electrical Contracting"
  | "Industrial Energy Services"
  | "Solar Installer"
  | "Panel / Inverter Distributor"
  | "Generator / UPS"
  | "EV Charging Installer";

export interface Lead {
  id: string;
  business_name: string;
  normalized_name: string;
  sector_category: SectorCategory;
  city: string;
  district: string;
  source: "manual_csv" | "osm" | "directory" | "saved_html" | "research_queue";
  source_url: string;
  osm_id?: string;
  website: string;
  canonical_domain: string;
  phone: string;
  email: string;
  rating?: number;
  review_count?: number;
  is_chain: boolean;
  location_count: number;
  collected_at: string;
  audit_date: string;
  website_status: WebsiteStatus;
  block_subtype: BlockSubtype;
  lead_segment: LeadSegment;
  design_signal: TrafficSignal;
  seo_signal: TrafficSignal;
  conversion_signal: TrafficSignal;
  technical_signal: TrafficSignal;
  trust_signal: TrafficSignal;
  priority: Priority;
  issues_found: string[];
  screenshot_path: string;
  calibration_anchor: string;
  manual_review_status: ManualReviewStatus;
}

export interface AuditRun {
  id: string;
  date: string;
  source: string;
  checked: number;
  reachable: number;
  broken: number;
  blocked: number;
  noWebsite: number;
  notes: string;
}

export interface CalibrationAnchor {
  id: string;
  name: string;
  label: "Excellent" | "Acceptable" | "Outdated" | "Broken" | "No website";
  category: SectorCategory;
  signals: Record<"design" | "seo" | "conversion" | "technical" | "trust", TrafficSignal>;
  notes: string;
}
