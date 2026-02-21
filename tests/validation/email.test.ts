import { test } from "vitest";
import assert from "node:assert";
import { validateEmail, normalizeEmail } from "@/lib/validation/email";

test("validateEmail accepts valid email", () => {
  assert.strictEqual(validateEmail("user@example.com"), null);
  assert.strictEqual(validateEmail("USER@EXAMPLE.COM"), null);
});

test("validateEmail rejects empty", () => {
  assert.ok(validateEmail(""));
  assert.ok(validateEmail("   "));
});

test("validateEmail rejects invalid TLD typo .con", () => {
  assert.ok(validateEmail("a@b.con"));
});

test("validateEmail rejects invalid format", () => {
  assert.ok(validateEmail("no-at-sign"));
  assert.ok(validateEmail("@nodomain.com"));
});

test("normalizeEmail lowercases and trims", () => {
  assert.strictEqual(normalizeEmail("  TEST@Example.COM  "), "test@example.com");
});
