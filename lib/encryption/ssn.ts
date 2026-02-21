import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const VERSION_PREFIX = "enc:v1:";

function getEncryptionKey(): Buffer {
  const secret = process.env.SSN_ENCRYPTION_KEY;
  if (secret && secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SSN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate: openssl rand -hex 32");
  }
  return Buffer.alloc(KEY_LENGTH, "dev-key-do-not-use-in-production");
}

export function encryptSsn(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext.trim(), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, enc]);
  return VERSION_PREFIX + combined.toString("base64url");
}

export function decryptSsn(ciphertext: string): string {
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }
  const key = getEncryptionKey();
  const raw = Buffer.from(ciphertext.slice(VERSION_PREFIX.length), "base64url");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(VERSION_PREFIX);
}

export function ssnLast4(plaintext: string): string {
  const digits = (plaintext ?? "").replace(/\D/g, "");
  return digits.slice(-4);
}

export function maskSsn(plaintext: string): string {
  const last = ssnLast4(plaintext);
  return last.length === 4 ? "***-**-" + last : "***-**-****";
}
