// Title e description di ogni pagina statica (l'HTML li serve già pronti ai motori).

export const pageSeo = {
  home: {
    title: "Infermiere a domicilio a Lucca | Medicazioni, ECG e prelievi",
    description:
      "Servizi infermieristici a domicilio a Lucca e provincia: medicazioni, ECG e prelievi a casa. Contatta Infermieri Web per informazioni o per fissare un intervento.",
  },
  domicilio: {
    title: "Servizi infermieristici a domicilio a Lucca | Infermieri Web",
    description:
      "Assistenza infermieristica domiciliare a Lucca, Capannori, Porcari e Altopascio: medicazioni, prelievi, iniezioni, flebo e monitoraggi direttamente a casa tua, 7 giorni su 7.",
  },
  strutture: {
    title: "Servizi ambulatoriali a Lucca | Infermieri Web",
    description:
      "Prestazioni infermieristiche anche in ambulatorio a Lucca: Eurofins Lamm, Centro Medico D33 e Farmacia Comunale 24h. Indirizzi, contatti e come raggiungerli.",
  },
  chiSiamo: {
    title: "Chi siamo | InfermieriWeb",
    description:
      "InfermieriWeb mette in contatto pazienti e infermieri liberi professionisti a domicilio: professionisti verificati, recensioni vere, zero commissioni.",
  },
  recensioni: {
    title: "Recensioni dei pazienti | Infermieri Web Lucca",
    description:
      "Le recensioni di chi ha scelto Infermieri Web per l'assistenza infermieristica a domicilio a Lucca: valutazione 5,0 su Google basata su recensioni verificate.",
  },
  articoli: {
    title: "Guide e Consigli Infermieristici | InfermieriWeb",
    description:
      "Articoli informativi realizzati da professionisti sanitari per aiutarti a comprendere meglio la tua salute e le prestazioni infermieristiche disponibili a Lucca e provincia.",
  },
  lavoraConNoi: {
    title: "Lavora con noi: infermieri a domicilio a Lucca | Infermieri Web",
    description:
      "Sei un infermiere libero professionista? Entra nella rete InfermieriWeb: richieste già filtrate nella tua zona, libertà di disponibilità e zero costi di iscrizione.",
  },
};

const clip = (text, max = 158) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

export function serviceSeo(serviceId, service) {
  if (serviceId === "medicazioni") {
    return {
      title: "Medicazioni a domicilio a Lucca | Infermieri Web",
      description:
        "Servizio di medicazioni semplici e complesse a domicilio a Lucca e provincia. Informazioni e contatti per richiedere assistenza infermieristica.",
    };
  }
  return {
    title: `${service.title} a domicilio a Lucca | Infermieri Web`,
    description: clip(`${service.fullDescription} Servizio disponibile a Lucca e provincia, ${service.price}.`),
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
    title: `${structure.name} - Lucca | Infermieri Web`,
    description: clip(
      `Prestazioni infermieristiche presso ${structure.name}, ${structure.address}. Telefono ${structure.phone}. Prenota la tua prestazione con Infermieri Web.`
    ),
  };
}
