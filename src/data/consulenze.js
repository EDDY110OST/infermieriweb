// Testi delle 5 consulenze per infermieri liberi professionisti (soci, 17/8/26).
// La lista "ufficiale" (chiavi, prezzi minimi, durata) sta in listino.js
// (LISTINO_CONSULENZA); qui ci sono solo i testi delle pagine pubbliche
// /consulenza e /consulenza/<slug>. Le pagine sono per COLLEGHI infermieri,
// non per pazienti: linguaggio da professionista a professionista.
import { LISTINO_CONSULENZA } from "./listino.js";

const TESTI = {
  "consulenza-avvio": {
    titolo: "Avvio della libera professione",
    breve: "Partita IVA, ENPAPI, regime fiscale, assicurazione: i primi passi senza errori.",
    descrizione:
      "Un'ora con un infermiere che la libera professione la fa davvero: si parte dalla tua situazione (dipendente, part-time, neolaureato) e si mette in fila cosa serve per iniziare: apertura della partita IVA e codice ATECO, iscrizione ENPAPI, scelta del regime fiscale, assicurazione RC, incompatibilità con l'eventuale contratto da dipendente, autorizzazioni e adempimenti di base.",
    comprende: [
      "Verifica della tua situazione di partenza (dipendente, part-time, altro)",
      "Passi per aprire la partita IVA e scelta del regime fiscale",
      "ENPAPI, assicurazione RC e adempimenti obbligatori",
      "Cosa puoi fare subito e cosa richiede autorizzazioni",
      "Elenco delle azioni da fare nelle prime settimane",
    ],
    perChi: [
      "Infermieri che vogliono iniziare a lavorare in proprio",
      "Dipendenti che valutano l'attività extra in libera professione",
      "Neolaureati che partono direttamente come liberi professionisti",
    ],
  },
  "consulenza-competenze": {
    titolo: "Analisi delle competenze e posizionamento",
    breve: "Capire cosa sai fare meglio e come proporlo, per non essere «uno dei tanti».",
    descrizione:
      "Ogni infermiere ha un bagaglio diverso: reparto, master, esperienze, attitudini. In questa consulenza si analizzano le tue competenze e si sceglie il posizionamento più sensato per la tua zona: quali prestazioni offrire per prime, a chi rivolgerti, come presentarti a pazienti, medici e strutture.",
    comprende: [
      "Mappa delle tue competenze e delle certificazioni spendibili",
      "Analisi della domanda nella tua zona e dei concorrenti",
      "Scelta del posizionamento (generalista, specialistico, di nicchia)",
      "Come presentarti a pazienti, medici di base e strutture",
      "Priorità concrete per i primi 3 mesi",
    ],
    perChi: [
      "Chi ha già la partita IVA ma fatica a farsi conoscere",
      "Chi ha una specializzazione (wound care, pediatria, geriatria…) e vuole valorizzarla",
      "Chi vuole cambiare zona o ambito di attività",
    ],
  },
  "consulenza-tariffario": {
    titolo: "Creazione dei servizi e del tariffario",
    breve: "Quali prestazioni offrire, come descriverle e quanto farsi pagare.",
    descrizione:
      "Il tariffario è la cosa che più spesso viene fatta «a sentimento». Qui si costruisce con metodo: elenco delle prestazioni, tempi reali, costi (materiali, spostamenti, tasse e contributi), prezzi minimi sostenibili, maggiorazioni (notte, festivi, distanza) e come comunicare i prezzi in modo chiaro.",
    comprende: [
      "Elenco delle prestazioni da offrire, con tempi realistici",
      "Calcolo dei costi reali (materiali, chilometri, tasse, contributi)",
      "Prezzo minimo sostenibile e prezzo consigliato per ogni prestazione",
      "Maggiorazioni: notturno, festivi, distanza, urgenza",
      "Come presentare il tariffario a pazienti e famiglie",
    ],
    perChi: [
      "Chi parte e non sa quanto chiedere",
      "Chi lavora già ma sospetta di essere sotto costo",
      "Chi vuole aggiungere nuove prestazioni al proprio listino",
    ],
  },
  "consulenza-organizzazione": {
    titolo: "Organizzazione e sviluppo dell'attività",
    breve: "Agenda, spostamenti, documenti, collaborazioni: far crescere l'attività senza bruciarsi.",
    descrizione:
      "Quando le richieste aumentano, il problema diventa l'organizzazione: come gestire agenda e spostamenti, quali documenti tenere (consensi, fatture, registri), come collaborare con colleghi e strutture, quando e come alzare i prezzi o dire di no. Un'ora per mettere ordine e decidere il prossimo passo di crescita.",
    comprende: [
      "Organizzazione dell'agenda e dei giri a domicilio",
      "Documenti e adempimenti da tenere in ordine",
      "Collaborazioni con colleghi, medici, strutture e RSA",
      "Quando alzare i prezzi, quando delegare, quando dire di no",
      "Piano di sviluppo per i 6-12 mesi successivi",
    ],
    perChi: [
      "Chi ha già pazienti e vuole crescere in modo sostenibile",
      "Chi lavora troppo e guadagna troppo poco",
      "Chi vuole strutturare l'attività (studio, collaboratori, rete)",
    ],
  },
  "consulenza-personalizzata": {
    titolo: "Consulenza personalizzata individuale",
    breve: "Un'ora su misura: porti la tua domanda, si lavora su quella.",
    descrizione:
      "Non tutte le situazioni stanno in una casella. Se hai un dubbio specifico (un contratto, una collaborazione, un problema con un committente, una scelta da fare) o vuoi semplicemente un confronto con chi ci è già passato, questa è la consulenza giusta: un'ora individuale, sul tuo caso, con indicazioni pratiche.",
    comprende: [
      "Un'ora individuale dedicata al tuo caso",
      "Analisi della situazione e delle opzioni possibili",
      "Indicazioni pratiche e prossimi passi",
      "Materiali o riferimenti utili, se servono",
      "Possibilità di consulenze successive di verifica",
    ],
    perChi: [
      "Chi ha una domanda precisa che non rientra nelle altre consulenze",
      "Chi vuole un confronto prima di una decisione importante",
      "Chi ha già fatto una consulenza e vuole fare il punto",
    ],
  },
};

// Elenco completo: listino (chiave, slug, prezzo, durata) + testi
export const CONSULENZE = LISTINO_CONSULENZA.map((v) => ({ ...v, ...TESTI[v.key] }));
export const CONSULENZE_PER_SLUG = Object.fromEntries(CONSULENZE.map((c) => [c.slug, c]));
export const CONSULENZE_PER_KEY = Object.fromEntries(CONSULENZE.map((c) => [c.key, c]));

// Domande frequenti comuni a tutte le consulenze
export const FAQ_CONSULENZE = [
  { question: "Come si svolge la consulenza?", answer: "Online (videochiamata) o per telefono, all'orario che prenoti dall'agenda del consulente. Dopo la conferma ricevi il suo recapito: vi accordate voi sul canale (Meet, WhatsApp, telefono)." },
  { question: "Quanto dura e quanto costa?", answer: "Ogni consulenza è di un'ora. Il prezzo lo decide il consulente ed è indicato nella sua scheda, accanto alla consulenza. Si paga direttamente a lui, non online." },
  { question: "Devo essere già libero professionista?", answer: "No: le consulenze servono proprio anche a chi sta valutando se iniziare. Basta essere infermiere (o studente all'ultimo anno)." },
  { question: "Chi sono i consulenti?", answer: "Infermieri iscritti all'albo, con esperienza reale di libera professione, verificati come tutti i professionisti di InfermieriWeb. Non sono commercialisti né avvocati: per gli aspetti fiscali o legali di dettaglio ti indicheranno quando serve un professionista specifico." },
  { question: "Posso disdire?", answer: "Sì, online e gratis, dal link che ricevi nell'email di conferma, entro il preavviso indicato dal consulente." },
];
