import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cifratura dei dati sanitari del Diario infermieristico (GDPR art. 9).
// Chiave AES-256 (32 byte) dalla env DIARIO_KEY (64 caratteri esadecimali).
// Fail-closed: se la chiave manca o è malformata NON si cifra e NON si salva —
// meglio un errore che scrivere dati clinici in chiaro nel database.

export function diarioConfigurato() {
  return /^[0-9a-fA-F]{64}$/.test(process.env.DIARIO_KEY || "");
}

function getKey() {
  const raw = process.env.DIARIO_KEY || "";
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("DIARIO_KEY mancante o non valida (servono 64 caratteri esadecimali)");
  }
  return Buffer.from(raw, "hex");
}

// Cifra un oggetto JS -> { data, iv, tag } (tutti base64), da salvare su colonne.
export function cifra(oggetto) {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(oggetto), "utf8"), cipher.final()]);
  return {
    data: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

// Decifra { data, iv, tag } -> oggetto JS. Se il tag non torna (dato manomesso
// o chiave sbagliata) lancia: chi chiama gestisce l'errore, non restituisce dati.
export function decifra({ data, iv, tag }) {
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const dec = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}
