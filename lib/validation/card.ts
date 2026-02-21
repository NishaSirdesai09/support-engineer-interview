/**
 * Luhn (mod 10) check for card number. Catches typos and transposition.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** Card length by type (without spaces). Standard lengths 13-19. */
const MIN_LENGTH = 13;
const MAX_LENGTH = 19;

/**
 * BIN prefix ranges (first digits). VAL-210: support Visa, MC, Amex, Discover.
 * Visa: 4; MC: 51-55, 2221-2720; Amex: 34, 37; Discover: 6011, 65, 644-649.
 */
function hasKnownPrefix(digits: string): boolean {
  if (digits.startsWith("4")) return true;
  if (/^5[1-5]/.test(digits)) return true;
  if (/^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(digits)) return true;
  if (/^3[47]/.test(digits)) return true;
  if (digits.startsWith("6011") || digits.startsWith("65")) return true;
  if (/^64[4-9]/.test(digits)) return true;
  return false;
}

/**
 * Validator for card number. Luhn + length + known BIN prefix.
 * VAL-206: invalid numbers rejected. VAL-210: valid cards (Visa, MC, Amex, Discover) accepted.
 */
export function validateCardNumber(value: string): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < MIN_LENGTH) return `Card number must be ${MIN_LENGTH}-${MAX_LENGTH} digits.`;
  if (digits.length > MAX_LENGTH) return `Card number must be ${MIN_LENGTH}-${MAX_LENGTH} digits.`;
  if (!/^\d+$/.test(digits)) return "Card number can only contain digits.";
  if (!luhnCheck(digits)) return "Invalid card number (check digits).";
  if (!hasKnownPrefix(digits)) return "Card type not recognized. We accept Visa, Mastercard, Amex, and Discover.";
  return null;
}
