import { z } from "zod";
import { refineWith } from "./refine";

const STATE_CODES_SET = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
  "AS", "GU", "MP", "PR", "VI",
]);

export const STATE_CODES_SORTED = [...STATE_CODES_SET].sort();

export function validateState(code: string): string | null {
  const normalized = code?.trim().toUpperCase() ?? "";
  if (!normalized) return "State is required.";
  if (normalized.length !== 2) return "Use 2-letter state code (e.g. CA).";
  if (!STATE_CODES_SET.has(normalized)) return "Enter a valid US state or territory code.";
  return null;
}

export const stateSchema = z
  .string()
  .min(1, "State is required.")
  .transform((s) => s.trim().toUpperCase())
  .superRefine(refineWith(validateState));
