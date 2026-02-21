import { z } from "zod";
import { refineWith } from "./refine";

const ZIP5_REGEX = /^\d{5}$/;

export function normalizeZipCode(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.slice(0, 5);
}

export function validateZipCode(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "ZIP code is required.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length !== 5) return "ZIP code must be 5 digits.";
  if (!ZIP5_REGEX.test(digits)) return "ZIP code must be 5 digits.";
  return null;
}

/** Zod schema for signup/API (5-digit ZIP). */
export const zipSchema = z
  .string()
  .min(1, "ZIP code is required.")
  .transform((s) => normalizeZipCode(s))
  .refine((s) => ZIP5_REGEX.test(s), "ZIP code must be 5 digits.");

const ZIP_API_BASE = "https://api.zippopotam.us/us";

export type ZipDetails = {
  zip: string;
  state: string;
  placeName: string;
};

export async function fetchZipDetails(zip5: string): Promise<ZipDetails | null> {
  const digits = (zip5 ?? "").replace(/\D/g, "").slice(0, 5);
  if (digits.length !== 5) return null;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${ZIP_API_BASE}/${digits}`, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      "post code"?: string;
      places?: Array<{ "place name"?: string; "state abbreviation"?: string }>;
    };
    const place = data.places?.[0];
    const state = place?.["state abbreviation"] ?? "";
    const placeName = place?.["place name"] ?? "";
    if (!state) return null;
    return { zip: digits, state, placeName };
  } catch {
    return null;
  }
}

export async function validateZipInState(zip5: string, stateCode: string): Promise<string | null> {
  const details = await fetchZipDetails(zip5);
  if (!details) return "ZIP code could not be verified or does not exist.";
  const stateUpper = (stateCode ?? "").trim().toUpperCase();
  if (stateUpper && details.state.toUpperCase() !== stateUpper) {
    return `ZIP code is in ${details.state}, not ${stateUpper}.`;
  }
  return null;
}
