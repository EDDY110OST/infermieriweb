// Title e description di ogni pagina statica (l'HTML li serve già pronti ai motori).

export const pageSeo = {
  domicilio: {
    title: "Prestazioni infermieristiche a domicilio | InfermieriWeb",
    description:
      "Medicazioni, prelievi, iniezioni, flebo, ECG e monitoraggi direttamente a casa tua, 7 giorni su 7: scopri tutte le prestazioni e prenota online il professionista della tua zona.",
  },
  chiSiamo: {
    title: "Chi siamo | InfermieriWeb",
    description:
      "InfermieriWeb mette in contatto pazienti e infermieri liberi professionisti a domicilio: infermieri iscritti all'Albo, recensioni verificate, zero commissioni.",
  },
  recensioni: {
    title: "Recensioni verificate dei pazienti | InfermieriWeb",
    description:
      "Le recensioni dei professionisti di InfermieriWeb: può lasciarle solo chi ha completato davvero una prenotazione. Nessuna recensione anonima o comprata.",
  },
  articoli: {
    title: "Guide e consigli infermieristici per pazienti e famiglie | InfermieriWeb",
    description:
      "Come funziona un ECG a domicilio, quanto costa un infermiere, come gestire un catetere: guide chiare scritte con i professionisti della rete.",
  },
  lavoraConNoi: {
    title: "Lavora con noi: la rete degli infermieri a domicilio | InfermieriWeb",
    description:
      "Sei un infermiere libero professionista? Entra nella rete InfermieriWeb: richieste già filtrate nella tua zona, libertà di disponibilità e zero costi di iscrizione.",
  },
};

const clip = (text, max = 158) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

import { NOMI_COLLOQUIALI } from "./servizi-extra.js";

export function serviceSeo(serviceId, service) {
  const nome = NOMI_COLLOQUIALI[serviceId] || `${service.title} a domicilio`;
  return {
    title: `${nome}: prezzi e prenotazione online | InfermieriWeb`,
    description: clip(
      `${nome} con infermieri iscritti all'albo nella tua zona: prezzi chiari nella scheda, prenoti online l'orario che preferisci e paghi dopo la prestazione.`
    ),
  };
}

export function articleSeo(article) {
  return {
    title: `${article.title} | InfermieriWeb`,
    description: clip(article.excerpt || "Scopri di più su InfermieriWeb."),
  };
}

