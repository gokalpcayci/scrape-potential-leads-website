import type { AuditRun, CalibrationAnchor, ExpansionLane, Lead, SourcePack } from "@/lib/lead-types";
import { normalizeDomain, normalizeName } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

function makeLead(
  input: Omit<
    Lead,
    | "id"
    | "normalized_name"
    | "canonical_domain"
    | "collected_at"
    | "audit_date"
    | "proof_fit_signal"
    | "contactability_signal"
    | "spam_exposure"
    | "source_confidence"
    | "opportunity_score"
    | "pipeline_stage"
    | "evidence_summary"
    | "next_action"
  > &
    Partial<Pick<Lead, "proof_fit_signal" | "contactability_signal" | "spam_exposure" | "source_confidence" | "opportunity_score" | "pipeline_stage" | "evidence_summary" | "next_action">> & {
      collected_at?: string;
      audit_date?: string;
    }
): Lead {
  return {
    ...input,
    id: crypto.randomUUID(),
    normalized_name: normalizeName(input.business_name),
    canonical_domain: normalizeDomain(input.website),
    collected_at: input.collected_at ?? today,
    audit_date: input.audit_date ?? today,
    proof_fit_signal: input.proof_fit_signal ?? "yellow",
    contactability_signal: input.contactability_signal ?? (input.phone || input.email ? "green" : "yellow"),
    spam_exposure: input.spam_exposure ?? "unknown",
    source_confidence: input.source_confidence ?? "medium",
    opportunity_score: input.opportunity_score ?? 60,
    pipeline_stage: input.pipeline_stage ?? "verify_fit",
    evidence_summary: input.evidence_summary ?? "Needs manual review before outreach.",
    next_action: input.next_action ?? "Open source, confirm fit, then capture one concrete website gap."
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
  "low_web_dev_spam_niche",
  "high_ticket_b2b_buyer",
  "public_project_signal",
  "supplier_or_dealer_signal",
  "osb_or_industrial_zone_signal",
  "manual_source_confirmed",
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

export const sourcePacks: SourcePack[] = [
  {
    id: "osb-electrical-contractors",
    title: "OSB electrical contractors",
    category: "Electrical Contracting",
    region: "Türkiye industrial zones",
    why_it_matters: "Industrial-zone contractors often sell high-ticket projects but present themselves with thin, old, or referral-only websites.",
    spam_exposure: "low",
    buyer_value: "very_high",
    proof_angle: "Your pitch can focus on procurement trust: project references, service pages, certificates, and quote paths.",
    queries: [
      '"elektrik taahhüt" "OSB" "referans"',
      '"pano" "trafo" "taahhüt" "OSB"',
      '"endüstriyel elektrik" "teklif" "Türkiye"'
    ],
    import_hint: "Prioritize firms with factory/OSB language, B2B project photos, phone/email, and weak service pages."
  },
  {
    id: "solar-epc-provincial",
    title: "Provincial GES / EPC firms",
    category: "GES / EPC",
    region: "Anatolia city clusters",
    why_it_matters: "Smaller city EPC firms can be commercially serious without being surrounded by web agency spam.",
    spam_exposure: "medium",
    buyer_value: "very_high",
    proof_angle: "Use energy-sector familiarity and project credibility as the wedge, not generic redesign language.",
    queries: [
      '"GES EPC" "Konya" firma',
      '"güneş enerji sistemleri" "Kayseri" "referanslarımız"',
      '"çatı ges" "teklif" "Bursa"'
    ],
    import_hint: "Look for companies with active project work but missing project case studies, certifications, or city/service pages."
  },
  {
    id: "generator-ups-service",
    title: "Generator / UPS service companies",
    category: "Generator / UPS",
    region: "İstanbul, Ankara, İzmir, Bursa",
    why_it_matters: "These businesses are urgent-service and B2B heavy; many need trust and contact clarity more than flashy branding.",
    spam_exposure: "low",
    buyer_value: "high",
    proof_angle: "Lead with downtime risk, emergency contact clarity, maintenance contracts, and brand/service coverage.",
    queries: [
      '"jeneratör UPS" "bakım" "servis"',
      '"kesintisiz güç kaynağı" "servis" "İstanbul"',
      '"jeneratör bakım anlaşması" firma'
    ],
    import_hint: "Strong candidates have phone-first websites, outdated design, and unclear service-area pages."
  },
  {
    id: "ev-charging-installers",
    title: "EV charging installers",
    category: "EV Charging Installer",
    region: "Türkiye",
    why_it_matters: "The market is still forming; installers need credibility, project scope clarity, and local SEO before it gets saturated.",
    spam_exposure: "medium",
    buyer_value: "high",
    proof_angle: "Frame around site surveys, apartment/site management pages, hotel/fleet pages, and installation trust.",
    queries: [
      '"EV şarj istasyonu kurulum" firma',
      '"şarj istasyonu" "apartman" "kurulum"',
      '"elektrikli araç şarj" "teklif" "kurulum"'
    ],
    import_hint: "Avoid national chains first; prioritize local installers or electrical firms branching into charging."
  },
  {
    id: "inverter-panel-distributors",
    title: "Panel / inverter distributors",
    category: "Panel / Inverter Distributor",
    region: "Türkiye",
    why_it_matters: "Distributor sites often have brand/dealer signals but weak product architecture and quote funnels.",
    spam_exposure: "medium",
    buyer_value: "high",
    proof_angle: "Pitch product structure, brand pages, dealer trust, technical documents, and quote conversion.",
    queries: [
      '"inverter distribütörü" Türkiye',
      '"solar panel bayi" "Türkiye"',
      '"fotovoltaik panel" "bayi" "teklif"'
    ],
    import_hint: "Prioritize businesses listing real brands but lacking clean product/category pages."
  }
];

export const expansionLanes: ExpansionLane[] = [
  {
    id: "industrial-maintenance",
    title: "Industrial maintenance firms",
    sector: "Industrial services",
    why_promising: "High-ticket B2B work, local trust matters, and many firms still rely on old referral networks.",
    spam_exposure: "low",
    buyer_value: "very_high",
    proof_needed: "One strong industrial case study or sector-specific landing page before outreach.",
    wait_reason: "Adjacent to energy, but should wait until the current energy source packs produce repeatable qualified rows.",
    first_queries: ['"endüstriyel bakım" "OSB" firma', '"fabrika bakım" "servis" "Türkiye"']
  },
  {
    id: "fire-safety-systems",
    title: "Fire safety and compliance systems",
    sector: "Safety / compliance",
    why_promising: "Regulation and trust-heavy buyers; less likely to be flooded by generic web-design pitches than restaurants or clinics.",
    spam_exposure: "low",
    buyer_value: "high",
    proof_needed: "A compliance/trust-focused example page and a clear audit rubric.",
    wait_reason: "Needs careful language around compliance claims before outreach.",
    first_queries: ['"yangın algılama sistemleri" "referans"', '"yangın söndürme sistemleri" "OSB"']
  },
  {
    id: "machine-service",
    title: "CNC / machine service companies",
    sector: "Manufacturing support",
    why_promising: "Specialized local B2B service with urgent downtime pain and often weak web presentation.",
    spam_exposure: "low",
    buyer_value: "high",
    proof_needed: "A service-area and emergency-response website structure.",
    wait_reason: "Promising, but less connected to the current proof asset than energy.",
    first_queries: ['"CNC servis" "bakım" firma', '"makine bakım" "OSB" "servis"']
  }
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
    proof_fit_signal: "green",
    contactability_signal: "green",
    spam_exposure: "medium",
    source_confidence: "medium",
    opportunity_score: 76,
    pipeline_stage: "shortlisted",
    priority: "High",
    issues_found: ["missing_project_references", "missing_certifications", "thin_technical_documents"],
    evidence_summary: "Energy-sector fit is strong, but the site needs visible project proof and certification trust.",
    next_action: "Capture two missing proof points, then position this as a trust-gap cleanup.",
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
    proof_fit_signal: "green",
    contactability_signal: "green",
    spam_exposure: "low",
    source_confidence: "medium",
    opportunity_score: 85,
    pipeline_stage: "ready_to_contact",
    priority: "High",
    issues_found: ["outdated_visual_system", "weak_service_pages", "missing_city_service_keywords"],
    evidence_summary: "Industrial contractor with high-value work and a visible outdated-site gap.",
    next_action: "Find a project/reference page gap and prepare a concise before-after redesign angle.",
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
    proof_fit_signal: "yellow",
    contactability_signal: "green",
    spam_exposure: "low",
    source_confidence: "low",
    opportunity_score: 74,
    pipeline_stage: "verify_fit",
    priority: "High",
    issues_found: ["no_website_found"],
    evidence_summary: "No website found; high-intent only if business activity is confirmed through a directory or map listing.",
    next_action: "Confirm the company is active before treating this as a first-site opportunity.",
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
    proof_fit_signal: "yellow",
    contactability_signal: "green",
    spam_exposure: "high",
    source_confidence: "medium",
    opportunity_score: 32,
    pipeline_stage: "parked",
    priority: "Low",
    issues_found: ["bot_or_cookie_block", "duplicate_chain_domain"],
    evidence_summary: "Repeated chain/corporate signal makes this less attractive for indie outreach.",
    next_action: "Deprioritize unless a local branch has independent buying authority.",
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
