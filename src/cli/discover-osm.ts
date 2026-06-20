const keyword = process.argv[2] ?? "solar";
const city = process.argv[3] ?? "Istanbul";

const overpassUrl = "https://overpass-api.de/api/interpreter";

function queryFor(keywordValue: string, cityValue: string) {
  return `
[out:json][timeout:25];
area["name"="${cityValue}"]["boundary"="administrative"]->.searchArea;
(
  node["name"~"${keywordValue}",i](area.searchArea);
  way["name"~"${keywordValue}",i](area.searchArea);
  relation["name"~"${keywordValue}",i](area.searchArea);
);
out center tags 50;
`;
}

async function main() {
  const response = await fetch(overpassUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: queryFor(keyword, city) })
  });

  if (!response.ok) {
    throw new Error(`Overpass failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    elements?: Array<{
      type: string;
      id: number;
      tags?: Record<string, string>;
    }>;
  };

  const rows =
    payload.elements?.map((item) => ({
      business_name: item.tags?.name ?? "",
      sector_category: "Industrial Energy Services",
      city,
      district: item.tags?.["addr:district"] ?? "",
      source: "osm",
      source_url: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      osm_id: `${item.type}/${item.id}`,
      website: item.tags?.website ?? item.tags?.["contact:website"] ?? "",
      phone: item.tags?.phone ?? item.tags?.["contact:phone"] ?? "",
      email: item.tags?.email ?? item.tags?.["contact:email"] ?? ""
    })) ?? [];

  console.log(JSON.stringify({ keyword, city, count: rows.length, rows }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
