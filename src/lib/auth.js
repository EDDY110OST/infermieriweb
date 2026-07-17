import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// Sessione: token firmato HMAC (stateless, adatto alle funzioni serverless)
const sign = (payload) => createHmac("sha256", SECRET).update(payload).digest("base64url");

export function createSession(data, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + maxAgeSeconds * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(token) {
  if (!token || !SECRET) return null;
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function sessionFromRequest(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)iw_session=([^;]+)/);
  return match ? readSession(decodeURIComponent(match[1])) : null;
}

// Un admin può operare su un professionista scelto (pid passato nel body/query);
// il professionista normale solo su sé stesso. Ritorna il pid effettivo o null.
export function pidBersaglio(session, fornito) {
  if (session?.role === "admin" && fornito) return Number(fornito) || null;
  return session?.pid || null;
}

// Vero quando un admin sta modificando la scheda di UN ALTRO professionista
// (serve per la traccia "modificato da").
export function adminSuAltro(session, fornito) {
  return !!(session?.role === "admin" && fornito && Number(fornito) !== session?.pid);
}

export function sessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `iw_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export const clearSessionCookie = "iw_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
