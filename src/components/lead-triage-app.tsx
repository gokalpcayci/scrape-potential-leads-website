"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  Bolt,
  Building2,
  CheckCircle2,
  ClipboardList,
  Command,
  Download,
  FileDown,
  FileUp,
  Gauge,
  Globe2,
  History,
  Info,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calibrationAnchors, researchQueries, sectorCategories, seedAuditRuns, seedLeads, turkeyCities } from "@/lib/lead-data";
import { buildSearchUrl, classifyPriority, dedupeLeads, leadsToCsv, parseCsvToLeads, signalBadgeVariant } from "@/lib/lead-engine";
import type { Lead, LeadSegment, ManualReviewStatus, Priority, TrafficSignal } from "@/lib/lead-types";
import { cn, downloadText } from "@/lib/utils";

const STORAGE_KEY = "energy-lead-triage:v1";

const navItems = [
  { id: "leads", label: "Leads", icon: Building2 },
  { id: "discovery", label: "Discovery", icon: Search },
  { id: "audits", label: "Audits", icon: Gauge },
  { id: "calibration", label: "Calibration", icon: BadgeCheck },
  { id: "imports", label: "Imports", icon: FileUp },
  { id: "exports", label: "Exports", icon: FileDown },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

type ActiveView = (typeof navItems)[number]["id"];

export function LeadTriageApp() {
  const [activeView, setActiveView] = useState<ActiveView>("leads");
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(seedLeads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<LeadSegment | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [csvText, setCsvText] = useState("");
  const [researchCity, setResearchCity] = useState("Türkiye");
  const [researchCategory, setResearchCategory] = useState("GES / EPC");
  const [darkMode, setDarkMode] = useState(false);
  const [keepScreenshots, setKeepScreenshots] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { leads: Lead[]; darkMode?: boolean; keepScreenshots?: boolean };
      setLeads(parsed.leads);
      setDarkMode(Boolean(parsed.darkMode));
      setKeepScreenshots(parsed.keepScreenshots ?? true);
      setSelectedLeadId(parsed.leads[0]?.id ?? "");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ leads, darkMode, keepScreenshots }));
  }, [darkMode, keepScreenshots, leads]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const haystack = `${lead.business_name} ${lead.sector_category} ${lead.city} ${lead.district} ${lead.issues_found.join(" ")}`.toLocaleLowerCase("tr");
      const matchesQuery = !query || haystack.includes(query.toLocaleLowerCase("tr"));
      const matchesSegment = segmentFilter === "all" || lead.lead_segment === segmentFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      const matchesCity = cityFilter === "all" || lead.city === cityFilter;
      return matchesQuery && matchesSegment && matchesPriority && matchesCity;
    });
  }, [cityFilter, leads, priorityFilter, query, segmentFilter]);

  const metrics = useMemo(() => {
    return {
      high: leads.filter((lead) => lead.priority === "High").length,
      firstSite: leads.filter((lead) => lead.lead_segment === "first_site").length,
      trustGap: leads.filter((lead) => lead.lead_segment === "trust_gap").length,
      noWebsite: leads.filter((lead) => lead.website_status === "no_website").length
    };
  }, [leads]);

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead;
        const next = { ...lead, ...patch };
        return { ...next, priority: patch.priority ?? classifyPriority(next) };
      })
    );
  }

  function importCsv() {
    const imported = parseCsvToLeads(csvText);
    const merged = dedupeLeads([...leads, ...imported]);
    setLeads(merged);
    setSelectedLeadId(merged[0]?.id ?? "");
    setCsvText("");
  }

  function exportCsv(scope: "all" | "filtered") {
    const rows = scope === "filtered" ? filteredLeads : leads;
    downloadText(`energy-leads-${scope}-${new Date().toISOString().slice(0, 10)}.csv`, leadsToCsv(rows));
  }

  function addResearchLead() {
    const now = new Date().toISOString().slice(0, 10);
    const name = `${researchCategory} research lead`;
    const lead: Lead = {
      id: crypto.randomUUID(),
      business_name: name,
      normalized_name: name.toLocaleLowerCase("tr"),
      sector_category: researchCategory as Lead["sector_category"],
      city: researchCity === "Türkiye" ? "" : researchCity,
      district: "",
      source: "research_queue",
      source_url: buildSearchUrl(`"${researchCategory}" "${researchCity}" firma`),
      website: "",
      canonical_domain: "",
      phone: "",
      email: "",
      is_chain: false,
      location_count: 1,
      collected_at: now,
      audit_date: now,
      website_status: "unknown",
      block_subtype: "none",
      lead_segment: "first_site",
      design_signal: "unknown",
      seo_signal: "unknown",
      conversion_signal: "unknown",
      technical_signal: "unknown",
      trust_signal: "unknown",
      priority: "Medium",
      issues_found: [],
      screenshot_path: "",
      calibration_anchor: "Acceptable",
      manual_review_status: "new"
    };
    setLeads((current) => [lead, ...current]);
    setSelectedLeadId(lead.id);
    setActiveView("leads");
  }

  const appShell = (
    <TooltipProvider>
      <SidebarProvider>
        <LeadSidebar activeView={activeView} setActiveView={setActiveView} />
        <SidebarInset className="h-svh overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/85 px-3 backdrop-blur md:px-5">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <p className="text-sm font-semibold text-foreground">Energy Lead Triage</p>
                <p className="text-xs text-muted-foreground">Türkiye energy-sector website opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setDarkMode((value) => !value)}>
                    {darkMode ? <Sun /> : <Moon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Command />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportCsv("filtered")}>
                    <Download className="size-4" /> Export filtered CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLeads(dedupeLeads(leads))}>
                    <Archive className="size-4" /> Collapse duplicates
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-3 md:p-5">
            {activeView === "leads" && (
              <LeadsScreen
                metrics={metrics}
                leads={filteredLeads}
                selectedLead={selectedLead}
                query={query}
                setQuery={setQuery}
                segmentFilter={segmentFilter}
                setSegmentFilter={setSegmentFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                selectLead={setSelectedLeadId}
                updateLead={updateLead}
              />
            )}
            {activeView === "discovery" && (
              <DiscoveryScreen
                researchCity={researchCity}
                setResearchCity={setResearchCity}
                researchCategory={researchCategory}
                setResearchCategory={setResearchCategory}
                addResearchLead={addResearchLead}
              />
            )}
            {activeView === "audits" && <AuditsScreen keepScreenshots={keepScreenshots} setKeepScreenshots={setKeepScreenshots} />}
            {activeView === "calibration" && <CalibrationScreen />}
            {activeView === "imports" && <ImportsScreen csvText={csvText} setCsvText={setCsvText} importCsv={importCsv} />}
            {activeView === "exports" && <ExportsScreen leads={leads} filteredLeads={filteredLeads} exportCsv={exportCsv} />}
            {activeView === "settings" && <SettingsScreen darkMode={darkMode} setDarkMode={setDarkMode} keepScreenshots={keepScreenshots} setKeepScreenshots={setKeepScreenshots} />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );

  return appShell;
}

function LeadSidebar({ activeView, setActiveView }: { activeView: ActiveView; setActiveView: (view: ActiveView) => void }) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" isActive tooltip="Lead Triage">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <Bolt className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Lead Triage</span>
                <span className="truncate text-xs">Zero-cost energy wedge</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeView === item.id}
                      tooltip={item.label}
                      onClick={() => setActiveView(item.id)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-lg border border-sidebar-border bg-background p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            $0 constraint
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">No paid APIs, no automated outreach, no fake speed score.</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function LeadsScreen(props: {
  metrics: { high: number; firstSite: number; trustGap: number; noWebsite: number };
  leads: Lead[];
  selectedLead?: Lead;
  query: string;
  setQuery: (value: string) => void;
  segmentFilter: LeadSegment | "all";
  setSegmentFilter: (value: LeadSegment | "all") => void;
  priorityFilter: Priority | "all";
  setPriorityFilter: (value: Priority | "all") => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  selectLead: (id: string) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
}) {
  const { metrics, leads, selectedLead } = props;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="High priority" value={metrics.high} icon={Zap} />
          <MetricCard label="First-site leads" value={metrics.firstSite} icon={Globe2} />
          <MetricCard label="Trust gaps" value={metrics.trustGap} icon={ShieldCheck} />
          <MetricCard label="No website" value={metrics.noWebsite} icon={Info} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Energy Leads</CardTitle>
                <CardDescription>Reviewable heuristic triage, not a perfect audit score.</CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search leads" />
                <Select value={props.segmentFilter} onValueChange={(value) => props.setSegmentFilter(value as LeadSegment | "all")}>
                  <SelectTrigger><SelectValue placeholder="Segment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All segments</SelectItem>
                    <SelectItem value="first_site">First site</SelectItem>
                    <SelectItem value="redesign">Redesign</SelectItem>
                    <SelectItem value="seo_cleanup">SEO cleanup</SelectItem>
                    <SelectItem value="trust_gap">Trust gap</SelectItem>
                    <SelectItem value="deprioritized">Deprioritized</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={props.priorityFilter} onValueChange={(value) => props.setPriorityFilter(value as Priority | "all")}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={props.cityFilter} onValueChange={props.setCityFilter}>
                  <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {turkeyCities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => props.selectLead(lead.id)}>
                    <TableCell>
                      <div className="font-medium">{lead.business_name}</div>
                      <div className="text-xs text-muted-foreground">{lead.sector_category} · {lead.city || "Türkiye"} {lead.district && `· ${lead.district}`}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={lead.priority === "High" ? "red" : lead.priority === "Medium" ? "yellow" : "green"}>{lead.priority}</Badge>
                        <Badge variant="outline">{lead.lead_segment}</Badge>
                        {lead.is_chain && <Badge variant="blue">{lead.location_count} locations</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SignalRow lead={lead} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary">{lead.source}</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">{lead.audit_date}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Select
                        value={lead.manual_review_status}
                        onValueChange={(value) => props.updateLead(lead.id, { manual_review_status: value as ManualReviewStatus })}
                      >
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {selectedLead && <LeadDetail lead={selectedLead} updateLead={props.updateLead} />}
    </div>
  );
}

function LeadDetail({ lead, updateLead }: { lead: Lead; updateLead: (id: string, patch: Partial<Lead>) => void }) {
  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{lead.business_name}</CardTitle>
          <CardDescription>{lead.sector_category} · {lead.city || "Türkiye"} {lead.district && `· ${lead.district}`}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Website status</span>
              <Badge variant={lead.website_status === "reachable" ? "green" : lead.website_status === "blocked" ? "yellow" : lead.website_status === "no_website" ? "red" : "outline"}>{lead.website_status}</Badge>
            </div>
            <div className="mt-2 text-sm">{lead.website || "No website found"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Block subtype: {lead.block_subtype}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SignalEditor label="Design" value={lead.design_signal} onChange={(design_signal) => updateLead(lead.id, { design_signal })} />
            <SignalEditor label="SEO" value={lead.seo_signal} onChange={(seo_signal) => updateLead(lead.id, { seo_signal })} />
            <SignalEditor label="Conversion" value={lead.conversion_signal} onChange={(conversion_signal) => updateLead(lead.id, { conversion_signal })} />
            <SignalEditor label="Trust" value={lead.trust_signal} onChange={(trust_signal) => updateLead(lead.id, { trust_signal })} />
          </div>

          <div>
            <Label>Structured issues</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lead.issues_found.map((issue) => <Badge key={issue} variant="outline">{issue}</Badge>)}
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <InfoRow label="Source" value={lead.source} />
            <InfoRow label="Collected" value={lead.collected_at} />
            <InfoRow label="Audit date" value={lead.audit_date} />
            <InfoRow label="Calibration" value={lead.calibration_anchor} />
            <InfoRow label="Screenshot" value={lead.screenshot_path || "Not captured"} />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <ClipboardList />
                Review evidence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review evidence</DialogTitle>
                <DialogDescription>Use this as a manual checklist before outreach. It is not automated proof.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <InfoRow label="Offer segment" value={lead.lead_segment} />
                <InfoRow label="Canonical domain" value={lead.canonical_domain || "None"} />
                <InfoRow label="Phone" value={lead.phone || "Not stored"} />
                <InfoRow label="Email" value={lead.email || "Not stored"} />
                <InfoRow label="Source URL" value={lead.source_url} />
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </aside>
  );
}

function DiscoveryScreen({ researchCity, setResearchCity, researchCategory, setResearchCategory, addResearchLead }: {
  researchCity: string;
  setResearchCity: (value: string) => void;
  researchCategory: string;
  setResearchCategory: (value: string) => void;
  addResearchLead: () => void;
}) {
  const generatedQuery = `"${researchCategory}" "${researchCity}" firma`;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Free Discovery</CardTitle>
            <CardDescription>Generate review queues, use OSM where useful, and import public directory findings manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="research">
              <TabsList>
                <TabsTrigger value="research">Research queue</TabsTrigger>
                <TabsTrigger value="osm">OSM / Overpass</TabsTrigger>
                <TabsTrigger value="directory">Directory HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="research" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={researchCategory} onValueChange={setResearchCategory}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>{sectorCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Market</Label>
                    <Input className="mt-2" value={researchCity} onChange={(event) => setResearchCity(event.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={addResearchLead}>
                      <Sparkles />
                      Queue lead
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Generated review URL</p>
                  <a className="mt-1 block truncate text-sm underline underline-offset-4" href={buildSearchUrl(generatedQuery)} target="_blank" rel="noreferrer">{buildSearchUrl(generatedQuery)}</a>
                </div>
              </TabsContent>
              <TabsContent value="osm">
                <ZeroCostNotice title="OSM discovery adapter" body="The CLI stub is included for free Overpass discovery. Coverage for energy-sector B2B companies can be sparse, so treat OSM as one source, not the source." />
              </TabsContent>
              <TabsContent value="directory">
                <ZeroCostNotice title="Saved HTML import" body="Use public pages you are allowed to review, save their HTML, then import structured rows through the CSV/import screen after manual extraction." />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Search Pack</CardTitle>
            <CardDescription>Review queries for energy-sector businesses in Türkiye.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {researchQueries.map((query) => (
              <a key={query} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent" href={buildSearchUrl(query)} target="_blank" rel="noreferrer">
                <span className="truncate">{query}</span>
                <Search className="size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuditsScreen({ keepScreenshots, setKeepScreenshots }: { keepScreenshots: boolean; setKeepScreenshots: (value: boolean) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Runs</CardTitle>
          <CardDescription>Browser-rendered heuristic checks. No Lighthouse or paid PageSpeed score in v1.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Checkbox id="screenshots" checked={keepScreenshots} onCheckedChange={(value) => setKeepScreenshots(Boolean(value))} />
            <Label htmlFor="screenshots">Save screenshots locally when a browser-rendered audit succeeds</Label>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Checked</TableHead>
                <TableHead>Reachable</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seedAuditRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.date}</TableCell>
                  <TableCell>{run.source}</TableCell>
                  <TableCell>{run.checked}</TableCell>
                  <TableCell>{run.reachable}</TableCell>
                  <TableCell>{run.blocked}</TableCell>
                  <TableCell className="text-muted-foreground">{run.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CalibrationScreen() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {calibrationAnchors.map((anchor) => (
        <Card key={anchor.id}>
          <CardHeader>
            <CardTitle className="text-base">{anchor.label}</CardTitle>
            <CardDescription>{anchor.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">{anchor.name}</p>
            <p className="text-xs leading-5 text-muted-foreground">{anchor.notes}</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(anchor.signals).map(([key, value]) => (
                <Badge key={key} variant={signalBadgeVariant(value)}>{key}: {value}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ImportsScreen({ csvText, setCsvText, importCsv }: { csvText: string; setCsvText: (value: string) => void; importCsv: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import</CardTitle>
        <CardDescription>Paste manually reviewed rows from directories, chamber listings, spreadsheets, or browser sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} className="min-h-[300px] font-mono text-xs" placeholder="business_name,sector_category,city,district,website,phone,email,source_url" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={importCsv} disabled={!csvText.trim()}>
            <Upload />
            Import and dedupe
          </Button>
          <Button variant="outline" onClick={() => setCsvText("business_name,sector_category,city,district,website,phone,email,source_url\nVoltaj Jeneratör UPS,Generator / UPS,Ankara,Ostim,,+90 312 000 00 00,,manual")}>
            Load example
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExportsScreen({ leads, filteredLeads, exportCsv }: { leads: Lead[]; filteredLeads: Lead[]; exportCsv: (scope: "all" | "filtered") => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ranked CSV</CardTitle>
          <CardDescription>Exports keep structured issue tags and manual-review state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => exportCsv("filtered")}>
            <Download />
            Export filtered rows ({filteredLeads.length})
          </Button>
          <Button variant="outline" className="w-full" onClick={() => exportCsv("all")}>
            <Download />
            Export all rows ({leads.length})
          </Button>
        </CardContent>
      </Card>
      <ZeroCostNotice title="Review-first export" body="CSV export is for manual review and prioritization. The app does not send messages or create outreach automatically." />
    </div>
  );
}

function SettingsScreen({ darkMode, setDarkMode, keepScreenshots, setKeepScreenshots }: { darkMode: boolean; setDarkMode: (value: boolean) => void; keepScreenshots: boolean; setKeepScreenshots: (value: boolean) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>Sector-specific, zero-cost, local-first settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default market</Label>
            <Input className="mt-2" value="Energy-sector businesses in Türkiye" readOnly />
          </div>
          <div>
            <Label>Default categories</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">{sectorCategories.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Checkbox id="darkMode" checked={darkMode} onCheckedChange={(value) => setDarkMode(Boolean(value))} />
            <Label htmlFor="darkMode">Dark mode</Label>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Checkbox id="keepScreenshotsSettings" checked={keepScreenshots} onCheckedChange={(value) => setKeepScreenshots(Boolean(value))} />
            <Label htmlFor="keepScreenshotsSettings">Keep local screenshots</Label>
          </div>
        </CardContent>
      </Card>
      <ZeroCostNotice title="Source policy" body="Use manual CSV, OSM/Overpass, public directories, saved HTML, and research URLs. Paid API keys are intentionally not part of settings." />
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Bolt }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-foreground">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function SignalRow({ lead }: { lead: Lead }) {
  const signals: Array<[string, TrafficSignal]> = [
    ["D", lead.design_signal],
    ["S", lead.seo_signal],
    ["C", lead.conversion_signal],
    ["T", lead.trust_signal]
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {signals.map(([label, signal]) => <Badge key={label} variant={signalBadgeVariant(signal)}>{label} {signal}</Badge>)}
    </div>
  );
}

function SignalEditor({ label, value, onChange }: { label: string; value: TrafficSignal; onChange: (value: TrafficSignal) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as TrafficSignal)}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="green">Green</SelectItem>
          <SelectItem value="yellow">Yellow</SelectItem>
          <SelectItem value="red">Red</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-right text-xs font-medium">{value}</span>
    </div>
  );
}

function ZeroCostNotice({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
