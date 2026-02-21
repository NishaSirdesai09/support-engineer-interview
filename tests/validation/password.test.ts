import { test } from "vitest";
import assert from "node:assert";
import { validatePassword } from "@/lib/validation/password";

test("validatePassword rejects short", () => {
  assert.ok(validatePassword("Ab1!"));
});

test("validatePassword rejects no uppercase", () => {
  assert.ok(validatePassword("alllower1!"));
});

test("validatePassword rejects no lowercase", () => {
  assert.ok(validatePassword("ALLUPPER1!"));
});

test("validatePassword rejects no number", () => {
  assert.ok(validatePassword("NoNumbers!"));
});

test("validatePassword rejects no special", () => {
  assert.ok(validatePassword("NoSpecial1"));
});

test("validatePassword rejects common password", () => {
  assert.ok(validatePassword("password"));
  assert.ok(validatePassword("12345678"));
});

test("validatePassword accepts valid", () => {
  assert.strictEqual(validatePassword("ValidPass1!"), null);
});
