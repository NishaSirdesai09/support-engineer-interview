/**
 * Common TLD typos that are not valid (e.g. .con instead of .com).
 * Rejecting these avoids accepting clearly invalid addresses.
 */
const INVALID_TLD_TYPOS = new Set([
  "con",
  "cmo",
  "cm",
  "comm",
  "comp",
  "nettt",
  "nett",
  "om",
  "cpm",
  "coom",
  "commm",
  "orgn",
  "or",
  "ogr",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailTLD(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  const lastDot = domain.lastIndexOf(".");
  const tld = lastDot === -1 ? domain : domain.slice(lastDot + 1);
  if (tld.length < 2) return false;
  return !INVALID_TLD_TYPOS.has(tld);
}

export const EMAIL_TLD_ERROR = "Invalid email domain. Check for typos (e.g. .com).";
