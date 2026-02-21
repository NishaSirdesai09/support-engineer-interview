import { z } from "zod";
import { refineWith } from "./refine";

const DIGITS_ONLY = /^\d+$/;
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? (value.trimStart().startsWith("+") ? "+" : "") + digits : "";
}

export function validatePhone(value: string): string | null {
  const raw = value?.trim() ?? "";
  if (!raw) return "Phone number is required.";
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < MIN_DIGITS) return `Enter at least ${MIN_DIGITS} digits (e.g. with country code).`;
  if (digits.length > MAX_DIGITS) return `Phone number must be at most ${MAX_DIGITS} digits.`;
  if (!DIGITS_ONLY.test(digits)) return "Phone number can only contain digits and an optional leading +.";
  return null;
}

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required.")
  .transform(normalizePhone)
  .superRefine(refineWith(validatePhone));
