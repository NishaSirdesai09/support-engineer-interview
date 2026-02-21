const ROUTING_LENGTH = 9;

export function validateRoutingNumber(value: string): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 0) return "Routing number is required for bank transfers.";
  if (digits.length !== ROUTING_LENGTH) return "Routing number must be 9 digits.";
  if (!/^\d+$/.test(digits)) return "Routing number can only contain digits.";
  return null;
}
