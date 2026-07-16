// Nomi colloquiali (come cerca la gente, non come parla il listino),
// abbinamento guida↔articolo del blog e FAQ per le pagine /servizio/*.

export const NOMI_COLLOQUIALI = {
  ecg: "ECG a domicilio",
  medicazioni: "Medicazioni a domicilio",
  prelievi: "Prelievo del sangue a domicilio",
  iniezioni: "Iniezioni a domicilio",
  flebo: "Flebo a domicilio",
  desutura: "Rimozione punti di sutura a domicilio",
  "cateteri-vescicali": "Catetere vescicale a domicilio",
  "holter-pressori": "Holter pressorio a domicilio",
  "holter-cardiaci": "Holter cardiaco a domicilio",
  "sondini-naso-gastrici": "Sondino naso-gastrico a domicilio",
  "gestione-peg": "Gestione PEG a domicilio",
  "terapia-orale": "Somministrazione della terapia a domicilio",
  "parametri-vitali": "Controllo dei parametri vitali a domicilio",
  "clisteri-evacuativi": "Clistere evacuativo a domicilio",
  "gestione-stomie": "Gestione della stomia a domicilio",
  "educazione-terapeutica": "Educazione terapeutica a domicilio",
};

// guida servizio → articolo del blog che approfondisce (e viceversa)
export const ARTICOLO_PER_SERVIZIO = {
  ecg: "ecg-a-domicilio-come-funziona",
  prelievi: "prelievi-sangue-a-domicilio",
  medicazioni: "medicazioni-semplici-e-complesse",
  "cateteri-vescicali": "catetere-vescicale-sostituzione-gestione",
  "gestione-stomie": "gestione-della-stomia-a-domicilio",
  "holter-cardiaci": "holter-cardiaco-pressorio-differenze",
  "holter-pressori": "holter-cardiaco-pressorio-differenze",
};

export const SERVIZIO_PER_ARTICOLO = {
  "ecg-a-domicilio-come-funziona": "ecg",
  "prelievi-sangue-a-domicilio": "prelievi",
  "medicazioni-semplici-e-complesse": "medicazioni",
  "catetere-vescicale-sostituzione-gestione": "cateteri-vescicali",
  "gestione-della-stomia-a-domicilio": "gestione-stomie",
  "holter-cardiaco-pressorio-differenze": "holter-cardiaci",
  "quando-richiedere-assistenza-infermieristica-domiciliare": "medicazioni",
  "quanto-costa-infermiere-domicilio-lucca": "prelievi",
};

// FAQ oneste per la pagina servizio (niente promesse che la piattaforma non controlla)
export function faqServizio(nomeColloquiale) {
  return [
    {
      question: `Quanto costa ${nomeColloquiale.toLowerCase()}?`,
      answer: `Il prezzo è indicato nella scheda di ogni professionista, accanto a ciascuna prestazione: può variare in base alla complessità e alla distanza. Il compenso si paga direttamente all'infermiere, dopo la prestazione — nessun pagamento online.`,
    },
    {
      question: "Serve la prescrizione del medico?",
      answer: "Per alcune prestazioni sì (ad esempio terapie iniettive e infusionali serve l'indicazione del medico curante). L'infermiere te lo conferma al momento della prenotazione: tienila a portata di mano se ce l'hai.",
    },
    {
      question: "In quali zone è disponibile?",
      answer: "Nelle zone coperte dai professionisti della rete: le trovi nella scheda di ciascuno. Se la tua città non è ancora coperta, puoi lasciare l'email e ti avvisiamo appena arriviamo.",
    },
  ];
}

// Abbinamento pagina-prestazione → servizio in agenda: pattern espliciti sul
// nome (il vecchio LIKE sulla prima parola sbagliava prezzo e professionista).
// like: almeno uno deve comparire nel nome; not: nessuno deve comparire.
export const MATCH_SERVIZIO = {
  ecg: { like: ["ecg", "elettrocardiogramma"], not: ["holter"] },
  medicazioni: { like: ["medicazion"] },
  prelievi: { like: ["preliev"] },
  iniezioni: { like: ["iniezion", "intramuscol"] },
  flebo: { like: ["flebo", "infusional"] },
  desutura: { like: ["sutur"] },
  "cateteri-vescicali": { like: ["cateter"] },
  "holter-pressori": { like: ["holter pressor"] },
  "holter-cardiaci": { like: ["holter cardiac", "holter ecg"] },
  "sondini-naso-gastrici": { like: ["sondin"] },
  "gestione-peg": { like: ["peg"] },
  "terapia-orale": { like: ["terapia orale"] },
  "parametri-vitali": { like: ["parametri"] },
  "clisteri-evacuativi": { like: ["clister"] },
  "gestione-stomie": { like: ["stomi"] },
  "educazione-terapeutica": { like: ["educazion"] },
};

export function matchServizio(serviceId, nomeServizio) {
  const regole = MATCH_SERVIZIO[serviceId];
  if (!regole) return false;
  const nome = String(nomeServizio).toLowerCase();
  if ((regole.not || []).some((p) => nome.includes(p))) return false;
  return regole.like.some((p) => nome.includes(p));
}
