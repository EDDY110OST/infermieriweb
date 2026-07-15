// TOTP (RFC 6238) implementato con la sola crypto di Node: niente dipendenze,
// compatibile con Google Authenticator, Apple Password, Authy, 1Password ecc.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALFABETO_B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generaSegreto() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += ALFABETO_B32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out; // 32 caratteri base32
}

function decodificaB32(secret) {
  const pulito = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of pulito) bits += ALFABETO_B32.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function codiceTotp(secret, contatore) {
  const chiave = decodificaB32(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(contatore));
  const hmac = createHmac("sha1", chiave).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const num = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(num % 1_000_000).padStart(6, "0");
}

/** Verifica un codice a 6 cifre, tollerando ±1 finestra da 30s (orologi sfasati). */
export function verificaCodice(secret, codice) {
  const pulito = String(codice || "").replace(/\D/g, "");
  if (pulito.length !== 6 || !secret) return false;
  const finestra = Math.floor(Date.now() / 1000 / 30);
  for (const delta of [0, -1, 1]) {
    const atteso = codiceTotp(secret, finestra + delta);
    if (atteso.length === pulito.length && timingSafeEqual(Buffer.from(atteso), Buffer.from(pulito))) return true;
  }
  return false;
}

export function urlOtpauth(secret, account) {
  const issuer = "InfermieriWeb";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
