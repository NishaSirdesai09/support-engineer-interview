import { test } from "vitest";
import assert from "node:assert";
import { validateFundingAmount, normalizeAmount } from "@/lib/validation/amount";

test("validateFundingAmount rejects zero", () => {
  assert.ok(validateFundingAmount("0"));
  assert.ok(validateFundingAmount("0.00"));
});

test("validateFundingAmount rejects empty", () => {
  assert.ok(validateFundingAmount(""));
});

test("validateFundingAmount accepts valid amount", () => {
  assert.strictEqual(validateFundingAmount("100"), null);
  assert.strictEqual(validateFundingAmount("10.50"), null);
});

test("validateFundingAmount rejects over 10000", () => {
  assert.ok(validateFundingAmount("10001"));
});

test("normalizeAmount strips leading zeros", () => {
  assert.strictEqual(normalizeAmount("007.50"), "7.50");
});
