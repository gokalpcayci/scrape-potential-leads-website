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
export type ExposureLevel = "low" | "medium" | "high" | "unknown";
export type SourceConfidence = "low" | "medium" | "high";
export type PipelineStage = "source_lane" | "verify_fit" | "capture_evidence" | "shortlisted" | "ready_to_contact" | "parked";

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
  proof_fit_signal: TrafficSignal;
  contactability_signal: TrafficSignal;
  spam_exposure: ExposureLevel;
  source_confidence: SourceConfidence;
  opportunity_score: number;
  priority: Priority;
  pipeline_stage: PipelineStage;
  issues_found: string[];
  evidence_summary: string;
  next_action: string;
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

export interface SourcePack {
  id: string;
  title: string;
  category: SectorCategory;
  region: string;
  why_it_matters: string;
  spam_exposure: ExposureLevel;
  buyer_value: "medium" | "high" | "very_high";
  proof_angle: string;
  queries: string[];
  import_hint: string;
}

export interface ExpansionLane {
  id: string;
  title: string;
  sector: string;
  why_promising: string;
  spam_exposure: ExposureLevel;
  buyer_value: "medium" | "high" | "very_high";
  proof_needed: string;
  wait_reason: string;
  first_queries: string[];
}
