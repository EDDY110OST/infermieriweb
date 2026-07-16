// Title e description di ogni pagina statica (l'HTML li serve già pronti ai motori).

export const pageSeo = {
  home: {
    title: "Infermiere a domicilio a Lucca | Medicazioni, ECG e prelievi",
    description:
      "Servizi infermieristici a domicilio a Lucca e provincia: medicazioni, ECG e prelievi a casa. Contatta InfermieriWeb per informazioni o per fissare un intervento.",
  },
  domicilio: {
    title: "Servizi infermieristici a domicilio a Lucca | InfermieriWeb",
    description:
      "Assistenza infermieristica domiciliare a Lucca, Capannori, Porcari e Altopascio: medicazioni, prelievi, iniezioni, flebo e monitoraggi direttamente a casa tua, 7 giorni su 7.",
  },
  strutture: {
    title: "Servizi ambulatoriali a Lucca | InfermieriWeb",
    description:
      "Prestazioni infermieristiche anche in ambulatorio a Lucca: Eurofins Lamm, Centro Medico D33 e Farmacia Comunale 24h. Indirizzi, contatti e come raggiungerli.",
  },
  chiSiamo: {
    title: "Chi siamo | InfermieriWeb",
    description:
      "InfermieriWeb mette in contatto pazienti e infermieri liberi professionisti a domicilio: professionisti verificati, recensioni vere, zero commissioni.",
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
    title: "Lavora con noi: infermieri a domicilio a Lucca | InfermieriWeb",
    description:
      "Sei un infermiere libero professionista? Entra nella rete InfermieriWeb: richieste già filtrate nella tua zona, libertà di disponibilità e zero costi di iscrizione.",
  },
};

const clip = (text, max = 158) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

import { NOMI_COLLOQUIALI } from "./servizi-extra.js";

export function serviceSeo(serviceId, service) {
  const nome = NOMI_COLLOQUIALI[serviceId] || `${service.title} a domicilio`;
  return {
    title: `${nome} a Lucca | InfermieriWeb`,
    description: clip(
      `${nome} a Lucca e provincia con infermieri iscritti all'albo: prezzi chiari nella scheda, prenoti online l'orario che preferisci e paghi dopo la prestazione.`
    ),
  };
}

export function articleSeo(article) {
  return {
    title: `${article.title} | InfermieriWeb`,
    description: clip(article.excerpt || "Scopri di più su InfermieriWeb."),
  };
}

export function structureSeo(structure) {
  return {
    title: `${structure.name} - Lucca | InfermieriWeb`,
    description: clip(
      `Prestazioni infermieristiche presso ${structure.name}, ${structure.address}. Telefono ${structure.phone}. Prenota la tua prestazione con InfermieriWeb.`
    ),
  };
}
