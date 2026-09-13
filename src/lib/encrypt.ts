import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Cifrado simétrico AES-256-GCM para datos sensibles en reposo
// (hoy: números de cuenta bancaria de `bank_accounts`).
//
// - La clave vive SOLO en el entorno (BANK_ACCOUNT_ENC_KEY, 64 chars hex =
//   32 bytes). Nunca viaja al navegador ni a la base de datos.
// - Formato guardado: "enc1:" + base64(iv + authTag + ciphertext).
// - Valores legacy sin prefijo se devuelven tal cual (lectura tolerante para
//   filas viejas sin cifrar; la migración las cifra vía patcheo/script).
// - Este módulo usa `node:crypto`: SOLO importar desde código server-side
//   (API routes), nunca desde componentes cliente.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PREFIX = "enc1:";

function loadKey(): Buffer | null {
  const raw = process.env.BANK_ACCOUNT_ENC_KEY?.trim() ?? "";
  if (!raw) return null;
  const hex = raw.replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error("BANK_ACCOUNT_ENC_KEY debe ser 32 bytes en hexadecimal (64 caracteres)");
  }
  return Buffer.from(hex, "hex");
}

export function isEncrypted(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}

export function encryptValue(value: string): string {
  const key = loadKey();
  if (!key) {
    throw new Error("Falta la variable de entorno BANK_ACCOUNT_ENC_KEY");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptValue(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const key = loadKey();
  if (!key) {
    throw new Error("Falta la variable de entorno BANK_ACCOUNT_ENC_KEY");
  }
  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  if (payload.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Dato cifrado inválido");
  }
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = payload.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptBankAccountNumber(value: string): string {
  return encryptValue(value);
}

export function decryptBankAccountNumber(value: string): string {
  return decryptValue(value);
}

export function bankAccountLastFour(value: string): string {
  const decrypted = decryptValue(value);
  return decrypted.slice(-4) || "••••";
}