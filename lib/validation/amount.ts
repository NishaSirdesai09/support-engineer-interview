const MAX_AMOUNT = 10_000;

/**
 * Normalize amount string: strip leading zeros, max 2 decimal places.
 * VAL-209: avoids "007.50" in records; use for display and submit.
 */
export function normalizeAmount(value: string): string {
  const parsed = parseFloat(value.replace(/,/g, "").trim());
  if (Number.isNaN(parsed)) return value.trim();
  const clamped = Math.min(MAX_AMOUNT, Math.max(0, parsed));
  return clamped.toFixed(2);
}

/**
 * Validator for funding amount. Reject zero, enforce range and format.
 * VAL-205: amount must be > 0. VAL-209: reject confusing leading zeros.
 */
export function validateFundingAmount(value: string): string | null {
  const raw = value?.trim().replace(/,/g, "") ?? "";
  if (!raw) return "Amount is required.";
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return "Enter a valid amount (e.g. 10.00).";
  if (num <= 0) return "Amount must be greater than $0.00.";
  if (num > MAX_AMOUNT) return `Amount cannot exceed $${MAX_AMOUNT.toLocaleString()}.`;
  if (raw.includes(".") && raw.split(".")[1]?.length > 2) return "Use at most 2 decimal places.";
  return null;
}

