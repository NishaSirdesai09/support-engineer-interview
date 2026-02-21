import { test } from "vitest";
import assert from "node:assert";
import { validateRoutingNumber } from "@/lib/validation/routing";

test("validateRoutingNumber rejects empty", () => {
  assert.ok(validateRoutingNumber(""));
});

test("validateRoutingNumber rejects wrong length", () => {
  assert.ok(validateRoutingNumber("12345678"));
  assert.ok(validateRoutingNumber("1234567890"));
});

test("validateRoutingNumber accepts 9 digits", () => {
  assert.strictEqual(validateRoutingNumber("123456789"), null);
  assert.strictEqual(validateRoutingNumber("021000021"), null);
});
