import { test } from "vitest";
import assert from "node:assert";
import { validateZipCode, normalizeZipCode } from "@/lib/validation/zip";

test("validateZipCode accepts 5 digits", () => {
  assert.strictEqual(validateZipCode("12345"), null);
  assert.strictEqual(validateZipCode("90210"), null);
});

test("validateZipCode rejects empty", () => {
  assert.ok(validateZipCode(""));
});

test("validateZipCode rejects non-5 digits", () => {
  assert.ok(validateZipCode("1234"));
  assert.ok(validateZipCode("123456"));
});

test("normalizeZipCode strips non-digits and takes first 5", () => {
  assert.strictEqual(normalizeZipCode("12345-6789"), "12345");
  assert.strictEqual(normalizeZipCode("123"), "123");
});
