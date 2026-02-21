import { z } from "zod";
import { refineWith } from "./refine";

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

const BASIC_EMAIL_REGEX = /^\S+@\S+\.\S+$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmailTLD(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  const lastDot = domain.lastIndexOf(".");
  const tld = lastDot === -1 ? domain : domain.slice(lastDot + 1);
  if (tld.length < 2) return false;
  return !INVALID_TLD_TYPOS.has(tld);
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email is required.";
  if (!BASIC_EMAIL_REGEX.test(normalized)) return "Invalid email address.";
  if (!isValidEmailTLD(normalized)) return "Invalid email domain. Check for typos (e.g. .com).";
  return null;
}

export const emailSchema = z
  .string()
  .min(1, "Email is required.")
  .transform(normalizeEmail)
  .superRefine(refineWith(validateEmail));
