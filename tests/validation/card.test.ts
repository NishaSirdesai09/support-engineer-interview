import { test } from "vitest";
import assert from "node:assert";
import { validateCardNumber } from "@/lib/validation/card";

test("validateCardNumber rejects too short", () => {
  assert.ok(validateCardNumber("123456789012"));
});

test("validateCardNumber rejects invalid Luhn", () => {
  assert.ok(validateCardNumber("4111111111111110"));
});

test("validateCardNumber accepts valid Visa", () => {
  assert.strictEqual(validateCardNumber("4111111111111111"), null);
});

test("validateCardNumber accepts valid Amex", () => {
  assert.strictEqual(validateCardNumber("378282246310005"), null);
});

test("validateCardNumber rejects unknown BIN", () => {
  assert.ok(validateCardNumber("9999999999999999"));
});
