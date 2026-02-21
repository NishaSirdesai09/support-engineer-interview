import { test } from "vitest";
import assert from "node:assert";
import { validateDateOfBirth, getDateOfBirthMin, getDateOfBirthMax, MIN_AGE_YEARS } from "@/lib/validation/dateOfBirth";

test("validateDateOfBirth rejects empty", () => {
  assert.ok(validateDateOfBirth(""));
  assert.ok(validateDateOfBirth("   "));
});

test("validateDateOfBirth rejects future date", () => {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  assert.ok(validateDateOfBirth(future.toISOString().slice(0, 10)));
});

test("validateDateOfBirth rejects under 18", () => {
  const minor = new Date();
  minor.setFullYear(minor.getFullYear() - 10);
  assert.ok(validateDateOfBirth(minor.toISOString().slice(0, 10)));
});

test("validateDateOfBirth accepts 18+ valid date", () => {
  const adult = new Date();
  adult.setFullYear(adult.getFullYear() - MIN_AGE_YEARS - 1);
  assert.strictEqual(validateDateOfBirth(adult.toISOString().slice(0, 10)), null);
});

test("getDateOfBirthMin returns string YYYY-MM-DD", () => {
  const min = getDateOfBirthMin();
  assert.strictEqual(typeof min, "string");
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(min));
});

test("getDateOfBirthMax returns string YYYY-MM-DD", () => {
  const max = getDateOfBirthMax();
  assert.strictEqual(typeof max, "string");
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(max));
});
