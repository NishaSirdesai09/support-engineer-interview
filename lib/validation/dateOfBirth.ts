import { z } from "zod";
import { refineWith } from "./refine";

/** Minimum age to open an account (contractual capacity). */
export const MIN_AGE_YEARS = 18;

/** Maximum age to catch typos (e.g. 1925 vs 2025). */
const MAX_AGE_YEARS = 120;

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Latest allowed DOB (18 years ago today). Use as date input max so picker cannot select future or under-18. */
export function getDateOfBirthMax(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return toYYYYMMDD(d);
}

/** Earliest allowed DOB (120 years ago). Use as date input min so picker range matches validation. */
export function getDateOfBirthMin(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE_YEARS);
  return toYYYYMMDD(d);
}

/**
 * Single validator for date of birth. Returns an error message or null if valid.
 * Use this on both backend and frontend so rules and copy stay in one place.
 */
export function validateDateOfBirth(dateStr: string): string | null {
  if (!dateStr?.trim()) return "Date of birth is required.";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Please enter a valid date of birth.";
  const today = new Date();
  if (date > today) return "Date of birth cannot be in the future.";
  const ageMs = today.getTime() - date.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < MIN_AGE_YEARS) return `You must be at least ${MIN_AGE_YEARS} years old to open an account.`;
  if (ageYears > MAX_AGE_YEARS) return "Please check your date of birth.";
  return null;
}

/** Zod schema for signup/API; reuse so backend stays DRY. */
export const dateOfBirthSchema = z
  .string()
  .min(1, "Date of birth is required.")
  .superRefine(refineWith(validateDateOfBirth));
