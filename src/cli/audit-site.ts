import { chromium } from "playwright";

const website = process.argv[2];

if (!website) {
  console.error("Usage: bun run audit:site -- https://example.com");
  process.exit(1);
}

function classifyError(error: unknown) {
  const message = String(error);
  if (message.includes("ERR_NAME_NOT_RESOLVED")) return "dns_failure";
  if (message.includes("ERR_CERT") || message.includes("SSL")) return "tls_error";
  if (message.includes("Timeout")) return "timeout";
  return "unknown_block";
}

async function main() {
  const url = website.startsWith("http") ? website : `https://${website}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);

    const title = await page.title();
    const headings = await page.locator("h1, h2").evaluateAll((nodes) => nodes.slice(0, 8).map((node) => node.textContent?.trim()).filter(Boolean));
    const text = await page.locator("body").innerText({ timeout: 4000 }).catch(() => "");
    const lower = text.toLocaleLowerCase("tr");

    const issues = new Set<string>();
    if (!title || title.length < 12) issues.add("thin_title");
    if (!headings.length) issues.add("missing_headings");
    if (!/(referans|projeler|sertifika|belge|markalar)/i.test(lower)) issues.add("missing_project_references");
    if (!/(teklif|iletişim|whatsapp|randevu|proje)/i.test(lower)) issues.add("no_quote_cta");
    if (!/(ges|güneş|epc|enerji|inverter|jeneratör|ups|şarj|pano|trafo)/i.test(lower)) issues.add("weak_service_pages");
    if (response?.status() === 404) issues.add("http_404");
    if ((response?.status() ?? 200) >= 500) issues.add("http_5xx");

    const result = {
      url,
      status: response?.status() ?? null,
      website_status: response?.status() === 404 ? "broken" : "reachable",
      block_subtype: "none",
      title,
      headings,
      issues_found: Array.from(issues),
      note: "Heuristic browser-rendered triage only. No Lighthouse/PageSpeed scoring."
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          url,
          website_status: "blocked",
          block_subtype: classifyError(error),
          issues_found: ["load_failure"],
          note: "Blocked or failed locally; separate this from a confirmed business opportunity."
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
