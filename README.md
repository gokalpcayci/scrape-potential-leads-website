# scrape-potential-leads-website

Zero-Cost Energy Lead Triage

Local lead triage for Türkiye-based energy-sector businesses. The app uses free/manual sources, local heuristic auditing, and review-first exports.

## Run

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Zero-cost rules

- No paid discovery APIs.
- No PageSpeed API.
- Manual review remains required before outreach.
- Website checks are heuristic and should be treated as triage evidence.

## Optional CLI

```bash
bun run audit:site -- https://example.com
bun run discover:osm -- "solar" "Istanbul"
```
