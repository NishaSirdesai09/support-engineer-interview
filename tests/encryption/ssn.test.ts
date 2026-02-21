import { test } from "vitest";
import assert from "node:assert";
import {
  encryptSsn,
  decryptSsn,
  isEncrypted,
  ssnLast4,
  maskSsn,
} from "@/lib/encryption/ssn";

test("encryptSsn returns prefixed string", () => {
  const out = encryptSsn("123456789");
  assert.ok(out.startsWith("enc:v1:"));
  assert.ok(out.length > 20);
});

test("decryptSsn roundtrips", () => {
  const plain = "123456789";
  const enc = encryptSsn(plain);
  const dec = decryptSsn(enc);
  assert.strictEqual(dec, plain);
});

test("isEncrypted true for encrypted value", () => {
  assert.strictEqual(isEncrypted(encryptSsn("123456789")), true);
});

test("isEncrypted false for plaintext", () => {
  assert.strictEqual(isEncrypted("123456789"), false);
});

test("decryptSsn returns plaintext for non-encrypted", () => {
  assert.strictEqual(decryptSsn("123456789"), "123456789");
});

test("ssnLast4 returns last 4 digits", () => {
  assert.strictEqual(ssnLast4("123456789"), "6789");
  assert.strictEqual(ssnLast4("123-45-6789"), "6789");
});

test("maskSsn returns masked format", () => {
  assert.strictEqual(maskSsn("123456789"), "***-**-6789");
  assert.ok(maskSsn("12").includes("****"));
});
