import Papa from "papaparse";
import type { BlockSubtype, Lead, LeadSegment, Priority, TrafficSignal, WebsiteStatus } from "@/lib/lead-types";
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
      const base: Lead = {
        id: crypto.randomUUID(),
        business_name: businessName,
        normalized_name: normalizeName(businessName),
        sector_category: (row.sector_category || row.category || "GES / EPC") as Lead["sector_category"],
        city: row.city || fallbackCity,
        district: row.district || "",
        source: "manual_csv" as const,
        source_url: row.source_url || "manual import",
        osm_id: row.osm_id,
        website,
        canonical_domain: normalizeDomain(website),
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
        lead_segment: "first_site" as LeadSegment,
        design_signal: "unknown" as TrafficSignal,
        seo_signal: seoSignal,
        conversion_signal: conversionSignal,
        technical_signal: "unknown" as TrafficSignal,
        trust_signal: trustSignal,
        priority: "Medium" as Priority,
        issues_found: website ? [] : ["no_website_found"],
        screenshot_path: "",
        calibration_anchor: website ? "Acceptable" : "No website",
        manual_review_status: "new" as const
      };
      return { ...base, lead_segment: inferSegment(base), priority: classifyPriority(base) };
    });
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
