// Copertina di un articolo, nel BROWSER (8/10/26): la foto scelta si rimpicciolisce qui
// (al massimo 1200 px di larghezza, JPEG) prima di partire. Il server controlla di nuovo
// tipo e peso (validaCover in lib/articoli-infermieri.js).

export const PESO_MAX_FILE = 15 * 1024 * 1024; // la foto originale (dal telefono): 15 MB
const PESO_MAX_DATI = 880_000;                 // il risultato, sotto il limite del server

// Ritorna una Promise con il data URI JPEG, oppure un errore con un messaggio chiaro
export function preparaCopertina(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Nessuna immagine scelta"));
    if (!/^image\//.test(file.type || "")) return reject(new Error("Scegli una foto (JPEG, PNG o WebP)."));
    if (file.size > PESO_MAX_FILE) return reject(new Error("La foto è troppo pesante: al massimo 15 MB."));
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const scala = Math.min(1, 1200 / img.width);
      const w = Math.round(img.width * scala);
      const h = Math.round(img.height * scala);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(src);
      let qualita = 0.82;
      let dati = canvas.toDataURL("image/jpeg", qualita);
      while (dati.length > PESO_MAX_DATI && qualita > 0.4) {
        qualita -= 0.12;
        dati = canvas.toDataURL("image/jpeg", qualita);
      }
      if (dati.length > PESO_MAX_DATI) return reject(new Error("Non riesco a rendere la foto abbastanza leggera: provane un'altra."));
      resolve(dati);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error("Questa foto non si apre: provane un'altra (JPEG o PNG).")); };
    img.src = src;
  });
}
