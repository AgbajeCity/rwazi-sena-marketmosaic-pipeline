import { CONSUMER_DOMAINS, SENIOR_TITLE_KEYWORDS, FUNCTION_KEYWORDS } from "./config";

export type SeniorityTier = "HIGH_SENIORITY" | "PROBABLE_SENIORITY" | "INFERRED" | "UNVERIFIED";

function domainFromEmail(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function isCorporateDomain(email: string): boolean {
  return !CONSUMER_DOMAINS.has(domainFromEmail(email));
}

function hasSeniorTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return SENIOR_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function classifySeniority(
  email: string,
  jobTitle: string | null | undefined,
  role: string | null | undefined = null,
): SeniorityTier {
  const corporate = isCorporateDomain(email);
  const senior = hasSeniorTitle(jobTitle) || hasSeniorTitle(role);

  if (senior) return "HIGH_SENIORITY";
  if (corporate) return "PROBABLE_SENIORITY";
  return "UNVERIFIED";
}

export function domain(email: string): string {
  return domainFromEmail(email);
}

// Classify the business function from a job title / role, or null if unclear.
// First match in FUNCTION_KEYWORDS order wins (most specific listed first).
export function classifyFunction(
  jobTitle: string | null | undefined,
  role: string | null | undefined = null,
): string | null {
  const text = `${jobTitle ?? ""} ${role ?? ""}`.toLowerCase();
  if (!text.trim()) return null;
  for (const { label, keywords } of FUNCTION_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) return label;
  }
  return null;
}
