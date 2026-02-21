import { test } from "vitest";
import assert from "node:assert";
import { validatePhone, normalizePhone } from "@/lib/validation/phone";

test("validatePhone accepts 10 digits", () => {
  assert.strictEqual(validatePhone("1234567890"), null);
  assert.strictEqual(validatePhone("(123) 456-7890"), null);
});

test("validatePhone accepts E.164 style with plus", () => {
  assert.strictEqual(validatePhone("+11234567890"), null);
});

test("validatePhone rejects too short", () => {
  assert.ok(validatePhone("123"));
});

test("validatePhone rejects empty", () => {
  assert.ok(validatePhone(""));
});

test("normalizePhone strips non-digits keeps optional plus", () => {
  assert.strictEqual(normalizePhone("(123) 456-7890"), "1234567890");
  assert.ok(normalizePhone("+1 234 567 8901").startsWith("+"));
});
