import { test } from "vitest";
import assert from "node:assert";
import { validateState, STATE_CODES_SORTED } from "@/lib/validation/state";

test("validateState accepts valid codes", () => {
  assert.strictEqual(validateState("CA"), null);
  assert.strictEqual(validateState("ca"), null);
  assert.strictEqual(validateState("NY"), null);
});

test("validateState rejects invalid code XX", () => {
  assert.ok(validateState("XX"));
});

test("validateState rejects empty", () => {
  assert.ok(validateState(""));
  assert.ok(validateState("  "));
});

test("validateState rejects wrong length", () => {
  assert.ok(validateState("C"));
  assert.ok(validateState("CAA"));
});

test("STATE_CODES_SORTED is non-empty and sorted", () => {
  assert.ok(STATE_CODES_SORTED.length > 0);
  const sorted = [...STATE_CODES_SORTED].sort();
  assert.deepStrictEqual(STATE_CODES_SORTED, sorted);
});
