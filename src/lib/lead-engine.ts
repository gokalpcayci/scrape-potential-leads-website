import Papa from "papaparse";
import type { BlockSubtype, ExposureLevel, Lead, LeadSegment, PipelineStage, Priority, SourceConfidence, TrafficSignal, WebsiteStatus } from "@/lib/lead-types";
import { issueCatalog } from "@/lib/lead-data";
import { normalizeDomain, normalizeName } from "@/lib/utils";

export function dedupeLeads(leads: Lead[]) {
  const grouped = new Map<string, Lead[]>();
  for (const lead of leads) {
    const key = lead.canonical_domain || lead.osm_id || normalizeName(lead.business_name);
    grouped.set(key, [...(grouped.get(key) ?? []), lead]);
  }

  return Array.from(grouped.values()).map((group) => {
    const [primary] = group;
    const locationCount = Math.max(primary.location_count, group.length);
    const duplicate = group.length > 1 || primary.is_chain;
    return {
      ...primary,
      is_chain: duplicate,
      location_count: locationCount,
      issues_found: duplicate ? Array.from(new Set([...primary.issues_found, "duplicate_chain_domain"])) : primary.issues_found
    };
  });
}

export function classifyPriority(lead: Pick<Lead, "lead_segment" | "design_signal" | "seo_signal" | "conversion_signal" | "trust_signal" | "website_status" | "is_chain">): Priority {
  if (lead.is_chain && lead.lead_segment === "deprioritized") return "Low";
  if (lead.lead_segment === "first_site" || lead.lead_segment === "trust_gap") return "High";
  const redCount = [lead.design_signal, lead.seo_signal, lead.conversion_signal, lead.trust_signal].filter((signal) => signal === "red").length;
  if (redCount >= 2 || lead.website_status === "broken") return "High";
  if (redCount === 1) return "Medium";
  return "Low";
}

export function calculateOpportunityScore(
  lead: Pick<
    Lead,
    | "lead_segment"
    | "design_signal"
    | "seo_signal"
    | "conversion_signal"
    | "trust_signal"
    | "proof_fit_signal"
    | "contactability_signal"
    | "spam_exposure"
    | "source_confidence"
    | "website_status"
    | "is_chain"
  >
) {
  let score = 40;
  const segmentBoost: Record<LeadSegment, number> = {
    first_site: 18,
    redesign: 16,
    trust_gap: 15,
    seo_cleanup: 10,
    deprioritized: -14
  };
  const signalBoost: Record<TrafficSignal, number> = {
    red: 8,
    yellow: 4,
    green: -3,
    unknown: 0
  };
  const positiveSignalBoost: Record<TrafficSignal, number> = {
    green: 10,
    yellow: 5,
    red: -6,
    unknown: 0
  };
  const exposureBoost: Record<ExposureLevel, number> = {
    low: 12,
    medium: 3,
    high: -12,
    unknown: 0
  };
  const confidenceBoost: Record<SourceConfidence, number> = {
    high: 7,
    medium: 3,
    low: -4
  };

  score += segmentBoost[lead.lead_segment];
  score += signalBoost[lead.design_signal];
  score += signalBoost[lead.seo_signal];
  score += signalBoost[lead.conversion_signal];
  score += signalBoost[lead.trust_signal];
  score += positiveSignalBoost[lead.proof_fit_signal];
  score += positiveSignalBoost[lead.contactability_signal];
  score += exposureBoost[lead.spam_exposure];
  score += confidenceBoost[lead.source_confidence];
  if (lead.website_status === "blocked") score -= 6;
  if (lead.is_chain) score -= 5;

  return Math.max(0, Math.min(100, score));
}

export function scoreBand(score: number) {
  if (score >= 78) return "A";
  if (score >= 62) return "B";
  if (score >= 46) return "C";
  return "D";
}

export function inferPipelineStage(lead: Pick<Lead, "manual_review_status" | "opportunity_score" | "source_confidence" | "evidence_summary" | "website_status">): PipelineStage {
  if (lead.manual_review_status === "rejected") return "parked";
  if (lead.manual_review_status === "contacted") return "ready_to_contact";
  if (lead.opportunity_score >= 78 && lead.source_confidence === "high") return "ready_to_contact";
  if (lead.opportunity_score >= 70) return "shortlisted";
  if (lead.evidence_summary && lead.evidence_summary !== "Needs manual review before outreach.") return "capture_evidence";
  if (lead.website_status === "unknown") return "verify_fit";
  return "source_lane";
}

export function dailyQueueScore(lead: Pick<Lead, "pipeline_stage" | "opportunity_score" | "spam_exposure" | "source_confidence" | "manual_review_status">) {
  const stageBoost: Record<PipelineStage, number> = {
    source_lane: 12,
    verify_fit: 28,
    capture_evidence: 34,
    shortlisted: 40,
    ready_to_contact: 24,
    parked: -100
  };
  const exposureBoost: Record<ExposureLevel, number> = {
    low: 12,
    medium: 3,
    high: -16,
    unknown: 0
  };
  const confidenceBoost: Record<SourceConfidence, number> = {
    high: 8,
    medium: 3,
    low: -4
  };
  const statusPenalty = lead.manual_review_status === "rejected" || lead.manual_review_status === "contacted" ? -80 : 0;

  return Math.round(lead.opportunity_score * 0.7 + stageBoost[lead.pipeline_stage] + exposureBoost[lead.spam_exposure] + confidenceBoost[lead.source_confidence] + statusPenalty);
}

export function dailyActionLabel(stage: PipelineStage) {
  const labels: Record<PipelineStage, string> = {
    source_lane: "Open source lane",
    verify_fit: "Verify business fit",
    capture_evidence: "Capture proof gap",
    shortlisted: "Prepare approach",
    ready_to_contact: "Manual contact check",
    parked: "Leave parked"
  };
  return labels[stage];
}

export function hydrateLead(lead: Partial<Lead> & Pick<Lead, "business_name">): Lead {
  const now = new Date().toISOString().slice(0, 10);
  const website = lead.website ?? "";
  const status = lead.website_status ?? (website ? "unknown" : "no_website");
  const normalized = lead.normalized_name ?? normalizeName(lead.business_name);
  const base: Lead = {
    id: lead.id ?? crypto.randomUUID(),
    business_name: lead.business_name,
    normalized_name: normalized,
    sector_category: lead.sector_category ?? "GES / EPC",
    city: lead.city ?? "",
    district: lead.district ?? "",
    source: lead.source ?? "manual_csv",
    source_url: lead.source_url ?? "manual import",
    osm_id: lead.osm_id,
    website,
    canonical_domain: lead.canonical_domain ?? normalizeDomain(website),
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    rating: lead.rating,
    review_count: lead.review_count,
    is_chain: lead.is_chain ?? false,
    location_count: lead.location_count ?? 1,
    collected_at: lead.collected_at ?? now,
    audit_date: lead.audit_date ?? now,
    website_status: status,
    block_subtype: lead.block_subtype ?? "none",
    lead_segment: lead.lead_segment ?? "first_site",
    design_signal: lead.design_signal ?? "unknown",
    seo_signal: lead.seo_signal ?? (website ? "unknown" : "red"),
    conversion_signal: lead.conversion_signal ?? (website ? "unknown" : "red"),
    technical_signal: lead.technical_signal ?? "unknown",
    trust_signal: lead.trust_signal ?? (website ? "unknown" : "red"),
    proof_fit_signal: lead.proof_fit_signal ?? "yellow",
    contactability_signal: lead.contactability_signal ?? (lead.phone || lead.email ? "green" : "yellow"),
    spam_exposure: lead.spam_exposure ?? "unknown",
    source_confidence: lead.source_confidence ?? "medium",
    opportunity_score: lead.opportunity_score ?? 0,
    priority: lead.priority ?? "Medium",
    pipeline_stage: lead.pipeline_stage ?? "source_lane",
    issues_found: lead.issues_found ?? (website ? [] : ["no_website_found"]),
    evidence_summary: lead.evidence_summary ?? "Needs manual review before outreach.",
    next_action: lead.next_action ?? "Open source, confirm fit, then capture one concrete website gap.",
    screenshot_path: lead.screenshot_path ?? "",
    calibration_anchor: lead.calibration_anchor ?? (website ? "Acceptable" : "No website"),
    manual_review_status: lead.manual_review_status ?? "new"
  };
  const lead_segment = lead.lead_segment ?? inferSegment(base);
  const scored = { ...base, lead_segment };
  return {
    ...scored,
    priority: lead.priority ?? classifyPriority(scored),
    opportunity_score: lead.opportunity_score ?? calculateOpportunityScore(scored),
    pipeline_stage: lead.pipeline_stage ?? inferPipelineStage({ ...scored, opportunity_score: lead.opportunity_score ?? calculateOpportunityScore(scored) })
  };
}

export function inferSegment(lead: Pick<Lead, "website" | "design_signal" | "seo_signal" | "trust_signal" | "website_status">): LeadSegment {
  if (!lead.website || lead.website_status === "no_website") return "first_site";
  if (lead.design_signal === "red") return "redesign";
  if (lead.trust_signal === "red") return "trust_gap";
  if (lead.seo_signal === "red" || lead.seo_signal === "yellow") return "seo_cleanup";
  return "deprioritized";
}

export function signalBadgeVariant(signal: TrafficSignal) {
  if (signal === "green") return "green";
  if (signal === "yellow") return "yellow";
  if (signal === "red") return "red";
  return "outline";
}

export function subtypeFromStatus(status: WebsiteStatus): BlockSubtype {
  if (status === "broken") return "http_404";
  if (status === "blocked") return "unknown_block";
  return "none";
}

export function parseCsvToLeads(csv: string, fallbackCity = "İstanbul"): Lead[] {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const now = new Date().toISOString().slice(0, 10);
  return parsed.data
    .filter((row) => row.business_name || row.name || row["Business Name"])
    .map((row) => {
      const businessName = row.business_name || row.name || row["Business Name"] || "Unnamed business";
      const website = row.website || row.url || row.Website || "";
      const status: WebsiteStatus = website ? "unknown" : "no_website";
      const seoSignal: TrafficSignal = website ? "unknown" : "red";
      const conversionSignal: TrafficSignal = website ? "unknown" : "red";
      const trustSignal: TrafficSignal = website ? "unknown" : "red";
      const base: Lead = hydrateLead({
        id: crypto.randomUUID(),
        business_name: businessName,
        sector_category: (row.sector_category || row.category || "GES / EPC") as Lead["sector_category"],
        city: row.city || fallbackCity,
        district: row.district || "",
        source: "manual_csv" as const,
        source_url: row.source_url || "manual import",
        osm_id: row.osm_id,
        website,
        phone: row.phone || "",
        email: row.email || "",
        rating: row.rating ? Number(row.rating) : undefined,
        review_count: row.review_count ? Number(row.review_count) : undefined,
        is_chain: false,
        location_count: 1,
        collected_at: row.collected_at || now,
        audit_date: row.audit_date || now,
        website_status: status,
        block_subtype: "none" as const,
        design_signal: "unknown" as TrafficSignal,
        seo_signal: seoSignal,
        conversion_signal: conversionSignal,
        technical_signal: "unknown" as TrafficSignal,
        trust_signal: trustSignal,
        proof_fit_signal: (row.proof_fit_signal as TrafficSignal) || "yellow",
        contactability_signal: row.phone || row.email ? "green" : "yellow",
        spam_exposure: (row.spam_exposure as ExposureLevel) || "unknown",
        source_confidence: (row.source_confidence as SourceConfidence) || "medium",
        pipeline_stage: (row.pipeline_stage as PipelineStage) || undefined,
        issues_found: website ? [] : ["no_website_found"],
        evidence_summary: row.evidence_summary || "Imported row needs source confirmation.",
        next_action: row.next_action || "Validate website gap and business fit.",
        manual_review_status: "new" as const
      });
      const segmented = { ...base, lead_segment: inferSegment(base) };
      return {
        ...segmented,
        priority: classifyPriority(segmented),
        opportunity_score: calculateOpportunityScore(segmented)
      };
    });
}

export function parseResearchNotesToLeads(notes: string, fallbackCity = "İstanbul"): Lead[] {
  const urlRegex = /https?:\/\/[^\s|,;]+|www\.[^\s|,;]+/i;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phoneRegex = /(?:\+90|0)?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/;
  const cityHints = ["İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Konya", "Antalya", "Gaziantep", "Kayseri"];

  return notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(/\s+\|\s+|,|;|\t/).map((part) => part.trim()).filter(Boolean);
      const website = line.match(urlRegex)?.[0]?.replace(/^www\./, "https://www.") ?? "";
      const email = line.match(emailRegex)?.[0] ?? "";
      const phone = line.match(phoneRegex)?.[0] ?? "";
      const city = cityHints.find((hint) => line.toLocaleLowerCase("tr").includes(hint.toLocaleLowerCase("tr"))) ?? fallbackCity;
      const category = inferCategoryFromText(line);
      const nameCandidate = parts.find((part) => !urlRegex.test(part) && !emailRegex.test(part) && !phoneRegex.test(part)) ?? line;
      const businessName = nameCandidate
        .replace(urlRegex, "")
        .replace(emailRegex, "")
        .replace(phoneRegex, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      return hydrateLead({
        business_name: businessName || "Unnamed research lead",
        sector_category: category,
        city,
        district: "",
        source: "manual_csv",
        source_url: website || "manual research notes",
        website,
        phone,
        email,
        website_status: website ? "unknown" : "no_website",
        lead_segment: website ? "trust_gap" : "first_site",
        design_signal: "unknown",
        seo_signal: website ? "unknown" : "red",
        conversion_signal: phone || email ? "yellow" : "red",
        technical_signal: "unknown",
        trust_signal: "unknown",
        proof_fit_signal: "yellow",
        contactability_signal: phone || email ? "green" : "yellow",
        spam_exposure: "unknown",
        source_confidence: "low",
        pipeline_stage: "verify_fit",
        issues_found: website ? ["manual_source_confirmed"] : ["manual_source_confirmed", "no_website_found"],
        evidence_summary: `Parsed from research notes: ${line}`,
        next_action: "Open the source or website, confirm the business is active, then capture one concrete website gap.",
        manual_review_status: "new"
      });
    });
}

function inferCategoryFromText(text: string): Lead["sector_category"] {
  const lower = text.toLocaleLowerCase("tr");
  if (/(jeneratör|ups|kesintisiz güç)/i.test(lower)) return "Generator / UPS";
  if (/(şarj|charging|ev)/i.test(lower)) return "EV Charging Installer";
  if (/(inverter|panel|bayi|distribütör)/i.test(lower)) return "Panel / Inverter Distributor";
  if (/(elektrik|taahhüt|pano|trafo)/i.test(lower)) return "Electrical Contracting";
  if (/(solar|ges|güneş|epc)/i.test(lower)) return "GES / EPC";
  if (/(bakım|endüstriyel|servis)/i.test(lower)) return "Industrial Energy Services";
  return "GES / EPC";
}

export function leadsToCsv(leads: Lead[]) {
  return Papa.unparse(
    leads.map((lead) => ({
      ...lead,
      issues_found: lead.issues_found.join("|")
    }))
  );
}

export function buildSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function makeIssueOptions() {
  return issueCatalog.map((issue) => ({ label: issue.replaceAll("_", " "), value: issue }));
}
