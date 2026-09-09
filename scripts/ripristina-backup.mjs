#!/usr/bin/env node
/**
 * Rilegge un backup cifrato di InfermieriWeb.
 *
 *   BACKUP_KEY='la-passphrase' node scripts/ripristina-backup.mjs infermieriweb-backup-2026-09-09.json.gz.enc
 *
 * Scrive accanto al file l'archivio in chiaro (.json) e stampa i conteggi.
 * Formato: "IWBK1" | sale(16) | iv(12) | tag(16) | testo cifrato (AES-256-GCM su JSON gzippato).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { scryptSync, createDecipheriv } from "node:crypto";

const file = process.argv[2];
const passphrase = process.env.BACKUP_KEY || process.argv[3] || "";

if (!file || !passphrase) {
  console.error("Uso: BACKUP_KEY='...' node scripts/ripristina-backup.mjs <file.json.gz.enc>");
  process.exit(1);
}

const blob = readFileSync(file);
if (blob.subarray(0, 5).toString() !== "IWBK1") {
  console.error("Non è un backup cifrato InfermieriWeb (manca l'intestazione IWBK1).");
  process.exit(1);
}

const sale = blob.subarray(5, 21);
const iv = blob.subarray(21, 33);
const tag = blob.subarray(33, 49);
const cifrato = blob.subarray(49);

const decipher = createDecipheriv("aes-256-gcm", scryptSync(passphrase, sale, 32), iv);
decipher.setAuthTag(tag);

let json;
try {
  json = gunzipSync(Buffer.concat([decipher.update(cifrato), decipher.final()])).toString();
} catch {
  console.error("Passphrase sbagliata o file danneggiato.");
  process.exit(1);
}

const uscita = file.replace(/\.json\.gz\.enc$/, "") + ".json";
writeFileSync(uscita, json);
const dump = JSON.parse(json);
console.log(`✅ Backup del ${dump.creato} ripristinato in ${uscita}`);
for (const [t, righe] of Object.entries(dump.tabelle)) {
  console.log(`   ${t}: ${Array.isArray(righe) ? righe.length + " righe" : "ERRORE " + righe.errore}`);
}
