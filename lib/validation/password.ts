import { z } from "zod";
import { refineWith } from "./refine";

const MIN_LENGTH = 8;

const COMMON_PASSWORDS = new Set(
  ["password", "12345678", "qwerty", "abc123", "letmein", "welcome", "monkey", "dragon", "master", "sunshine"].map(
    (s) => s.toLowerCase()
  )
);

export function validatePassword(value: string): string | null {
  const s = value ?? "";
  if (s.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (!/[A-Z]/.test(s)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(s)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(s)) return "Password must include at least one number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)) return "Password must include at least one special character.";
  if (COMMON_PASSWORDS.has(s.toLowerCase())) return "Choose a stronger password (too common).";
  return null;
}

export const passwordSchema = z.string().min(1, "Password is required.").superRefine(refineWith(validatePassword));
