import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit nonce recommended for AES-GCM

function getEncryptionKey(): Buffer {
  const secret = process.env.GIFT_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing GIFT_SECRET_KEY environment variable on server");
  }
  // If provided as a 64-char hex string (32 bytes)
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }
  // Otherwise derive a deterministic 32-byte key via SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a sensitive string (e.g. vault secretKeyBase58) using AES-256-GCM.
 * Output format: iv_hex:tag_hex:ciphertext_hex
 */
export function encryptGiftSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decryptGiftSecret(encryptedPayload: string): string {
  const key = getEncryptionKey();
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret format");
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}
