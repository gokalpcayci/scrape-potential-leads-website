import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function normalizeDomain(website?: string) {
  if (!website) return "";
  try {
    const withProtocol = website.startsWith("http") ? website : `https://${website}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

export function normalizeName(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\b(ltd|şti|anonim|aş|as|san|tic|ve)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
