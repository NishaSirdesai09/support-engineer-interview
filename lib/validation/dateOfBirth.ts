import { z } from "zod";
import { refineWith } from "./refine";

export const MIN_AGE_YEARS = 18;
const MAX_AGE_YEARS = 120;

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDateOfBirthMax(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return toYYYYMMDD(d);
}

export function getDateOfBirthMin(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE_YEARS);
  return toYYYYMMDD(d);
}

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

export const dateOfBirthSchema = z
  .string()
  .min(1, "Date of birth is required.")
  .superRefine(refineWith(validateDateOfBirth));
