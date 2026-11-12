// Contenuto iniziale dei registri privacy (12/11/2026): le bozze scritte per l'avvocato,
// caricate nel database la prima volta che si apre Admin → Documenti. Da lì in poi il
// registro vero è quello nel database: questo file NON va più tenuto allineato.
export const SEME_TRATTAMENTI = [
  {
    "titolo": "Parte generale",
    "voci": [
      {
        "voce": "Titolari (contitolari, art. 26)",
        "contenuto": "Eduard Gabriel Duduc — [DA COMPILARE: codice fiscale, indirizzo]\nBruno Ieppariello — [DA COMPILARE: codice fiscale, indirizzo]"
      },
      {
        "voce": "Contatto per gli interessati",
        "contenuto": "info@infermieriweb.it"
      },
      {
        "voce": "Responsabile della protezione dei dati (DPO)",
        "contenuto": "Non nominato. [DA DECIDERE con l'avvocato: serve o no]"
      },
      {
        "voce": "Rappresentante nell'UE",
        "contenuto": "Non serve: i titolari sono in Italia"
      },
      {
        "voce": "Data della prima stesura",
        "contenuto": "12/11/2026"
      },
      {
        "voce": "Chi lo tiene aggiornato",
        "contenuto": "[DA COMPILARE: Bruno o Eduard] Dal 12/11/2026 il registro si tiene nel pannello di amministrazione: ogni modifica resta scritta con data e nome."
      },
      {
        "voce": "Fornitori usati da più trattamenti",
        "contenuto": "Render — Ospita il sito e il database. Dove: Francoforte (UE). La società è statunitense. La rete passa da Cloudflare\nBrevo — Spedisce le email del sito. Dove: Francia (UE)\nAruba — Casella info@infermieriweb.it. Dove: Italia"
      },
      {
        "voce": "Misure di sicurezza comuni a tutti i trattamenti",
        "contenuto": "- Il sito viaggia solo in HTTPS.\n- Il database accetta collegamenti solo dalla rete interna di Render. Da fuori non si raggiunge.\n- Le password sono conservate solo in forma cifrata non reversibile (scrypt).\n- Gli amministratori entrano solo con password più codice dell'app (2FA obbligatoria).\n- I link personali (conferma, disdetta, recensione, area paziente) sono firmati e scadono.\n- Le pagine personali non finiscono su Google (noindex).\n- Un contatore blocca i tentativi ripetuti (robot).\n- Ogni notte parte una copia di sicurezza cifrata (AES-256).\n- Ogni notte il sito cancella da solo i dati scaduti."
      }
    ]
  },
  {
    "titolo": "Prenotazioni a domicilio",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Fissare l'appuntamento, avvisare l'infermiere, mandare conferma, promemoria e link per disdire"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Esecuzione del servizio chiesto (art. 6.1.b). Per il dato che può rivelare la salute: consenso esplicito (art. 9.2.a)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Pazienti. Familiari che prenotano per loro"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Nome, telefono, email, indirizzo della visita, città, prestazione scelta, data e ora. Data, ora e testo dei consensi dati. Se prenota un familiare: nome del paziente e nome di chi prenota"
      },
      {
        "voce": "Dati particolari",
        "contenuto": "Sì: la prestazione scelta può rivelare un'esigenza di salute. Non chiediamo diagnosi né terapie, e il modulo invita a non scriverle"
      },
      {
        "voce": "Come si raccoglie il consenso",
        "contenuto": "Due spunte separate: una per la presa visione dell'informativa, una per il consenso esplicito. Chi prenota per un familiare dichiara di poterlo fare"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "All'infermiere scelto (email, pannello e notifica sul telefono). Ai due contitolari, come amministratori. Ai fornitori Render e Brevo"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "24 mesi dalla data dell'appuntamento. Poi nome, telefono, email e indirizzo vengono cancellati in automatico; resta la riga senza dati personali, per i conteggi. Le prenotazioni mai confermate via email vengono cancellate dopo 30 giorni"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "La prenotazione vale solo dopo la conferma via email (entro 60 minuti). L'infermiere viene avvisato solo dopo la conferma"
      },
      {
        "voce": "Nota",
        "contenuto": "gli amministratori vedono anche un elenco riassuntivo dei pazienti (nome, contatti, città, numero di appuntamenti), ricavato dalle prenotazioni. Serve per assistenza, contestazioni e abusi. Segue gli stessi tempi delle prenotazioni."
      }
    ]
  },
  {
    "titolo": "Consulenze fra colleghi",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Far prenotare a un infermiere un'ora di consulenza con un collega"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Esecuzione del servizio chiesto (art. 6.1.b)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Infermieri che prenotano la consulenza"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Nome, telefono, email, data e ora. Nessun indirizzo"
      },
      {
        "voce": "Dati particolari",
        "contenuto": "No"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Al consulente scelto. Ai contitolari. A Render e Brevo"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Come le prenotazioni: 24 mesi, poi cancellazione automatica dei dati personali"
      },
      {
        "voce": "Nota",
        "contenuto": "La consulenza si svolge fuori dal sito (telefono o videochiamata). Di quello che si dicono non conserviamo niente"
      }
    ]
  },
  {
    "titolo": "Area «Le mie prenotazioni»",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Far ritrovare al paziente le sue prenotazioni con un link personale ricevuto via email"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Esecuzione del servizio chiesto (art. 6.1.b)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Pazienti"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Email. Le prenotazioni collegate a quell'email"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Solo al paziente stesso. Fornitori: Render e Brevo"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Non c'è un archivio a parte: si leggono le prenotazioni (trattamento 1)"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "Nessuna password: link firmato e a scadenza, spedito solo all'email della prenotazione"
      }
    ]
  },
  {
    "titolo": "Recensioni",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Pubblicare sulla scheda dell'infermiere il giudizio di chi ha ricevuto la prestazione"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Consenso (art. 6.1.a), dato inviando la recensione dopo aver letto l'avviso di pubblicazione"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Pazienti che lasciano una recensione. Infermieri recensiti"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Stelle, testo, nome come scelto da chi scrive (anche solo iniziali), collegamento alla prenotazione"
      },
      {
        "voce": "Dati particolari",
        "contenuto": "Possibili, se chi scrive racconta fatti di salute. Le recensioni vengono lette prima di essere pubblicate"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Pubblico (sulla scheda). Contitolari. Render e Brevo (email di invito)"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Pubblicate: finché la scheda è online o finché l'autore chiede di toglierle. Respinte: 12 mesi, poi cancellate in automatico"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "Si può recensire solo dal link di una prestazione che l'infermiere ha segnato come svolta. Una sola recensione per prenotazione"
      }
    ]
  },
  {
    "titolo": "Richieste di informazioni e contatti",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Rispondere a chi scrive dal modulo «Richiedi informazioni»"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Risposta a una richiesta dell'interessato (art. 6.1.b) e legittimo interesse a rispondere (art. 6.1.f)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Pazienti, familiari, infermieri, chiunque scriva"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Motivo, nome, email, telefono, città, testo del messaggio, scelta sulla newsletter"
      },
      {
        "voce": "Dati particolari",
        "contenuto": "Non richiesti. Il modulo invita a non scrivere informazioni sulla salute"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Contitolari (pannello e casella info@). Render, Brevo, Aruba"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Nel database 24 mesi, poi cancellate in automatico. Nella casella info@: [DA DECIDERE: stessa durata, con pulizia periodica a mano]"
      }
    ]
  },
  {
    "titolo": "Newsletter e lista d'attesa",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Newsletter: mandare novità a chi le ha chieste. Lista d'attesa: avvisare quando un infermiere copre la zona cercata"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Consenso (art. 6.1.a), registrato con data e ora"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Chi si iscrive (pazienti, infermieri)"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Email. Per la lista d'attesa anche la zona. Da quale modulo arriva l'iscrizione"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Contitolari. Render. Brevo, quando si spedisce"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Fino a quando l'interessato chiede la cancellazione"
      },
      {
        "voce": "Punto aperto",
        "contenuto": "Non esiste ancora un link «cancellami» automatico. Va costruito prima del primo invio. Fino ad allora la cancellazione si chiede a info@"
      }
    ]
  },
  {
    "titolo": "Candidature dei professionisti",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Valutare chi chiede di entrare e controllare albo e partita IVA"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Misure precontrattuali chieste dall'interessato (art. 6.1.b)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Infermieri candidati"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Nome, sesso (per l'appellativo), email, telefono, professione, albo (ordine, numero, data), partita IVA, comune, indirizzo dello studio, messaggio, prestazioni e prezzi proposti, password scelta (cifrata), data di accettazione delle Condizioni e della dichiarazione sull'assicurazione"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Contitolari. Il dettaglio arriva solo a info@. Alla casella Gmail degli avvisi arriva solo «c'è una nuova candidatura», senza dati. Render, Brevo, Aruba"
      },
      {
        "voce": "Controlli esterni",
        "contenuto": "Albo sul portale FNOPI e partita IVA sul sito dell'Agenzia delle Entrate: consultazioni a mano di banche dati pubbliche"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Accettate: diventano account e scheda (trattamento 8). Non accettate: 12 mesi, poi cancellate in automatico"
      }
    ]
  },
  {
    "titolo": "Account e scheda pubblica dei professionisti",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Far entrare l'infermiere nella sua agenda. Mostrare la sua scheda ai pazienti. Scrivergli le comunicazioni di servizio"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Esecuzione del contratto di servizio (art. 6.1.b)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Infermieri iscritti"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Account: email, password cifrata, chiave della 2FA se attivata. Scheda: nome, foto, biografia, albo, partita IVA, comune, indirizzo e coordinate dello studio, zone coperte, prestazioni, prezzi, orari, specializzazioni, articoli scritti. Date delle verifiche di albo e partita IVA e chi le ha fatte. Chi ha modificato la scheda e quando"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Pubblico, per la parte di scheda. Contitolari. Render, Brevo. OpenStreetMap riceve l'indirizzo dello studio per calcolare il punto sulla mappa"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "OpenStreetMap ha sede nel Regno Unito (paese con decisione di adeguatezza). Riceve solo indirizzi di studi professionali"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Finché il profilo è in rete. Alla chiusura i dati personali vengono svuotati; resta una riga anonima per non perdere i conteggi. Resta ciò che la legge impone di tenere (per esempio dati fiscali, quando ci saranno abbonamenti)"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "2FA facoltativa per gli infermieri, obbligatoria per gli amministratori. Registro delle azioni degli amministratori, senza dati personali"
      }
    ]
  },
  {
    "titolo": "Registro degli accessi all'area riservata",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Proteggere gli account e aiutare chi non riesce a entrare"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Legittimo interesse alla sicurezza e all'assistenza (art. 6.1.f)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Infermieri iscritti. Chi prova a entrare con un'email non registrata"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Data e ora, esito (riuscito o no), tipo di dispositivo (per esempio «iPhone»), richieste e cambi di password. L'email scritta, solo se non corrisponde a un account. Mai l'indirizzo IP"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Solo ai contitolari. Render"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "12 mesi, poi cancellato in automatico. Alla chiusura del profilo, subito"
      }
    ]
  },
  {
    "titolo": "Notifiche push",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Avvisare l'infermiere sul telefono di nuove prenotazioni e disdette"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Esecuzione del servizio (art. 6.1.b), con attivazione volontaria dal browser"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Infermieri che le attivano"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Identificativo tecnico del dispositivo e chiavi di cifratura. Testo dell'avviso: solo giorno e ora dell'appuntamento, senza nome del paziente né prestazione (dal 12/11/2026)"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Al servizio push del browser dell'infermiere (Apple, Google o Mozilla), che lo consegna al telefono. Render"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "Possibile: i servizi push sono di società statunitensi. Il testo viaggia cifrato da capo a capo: il servizio push non lo può leggere"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "L'identificativo resta finché l'infermiere tiene attive le notifiche. Se il dispositivo non risponde più, si cancella da solo"
      }
    ]
  },
  {
    "titolo": "Segnalazioni di contenuti (regolamento sui servizi digitali)",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Ricevere ed esaminare le segnalazioni su recensioni, schede o articoli, e rispondere con la decisione"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Obbligo di legge (art. 6.1.c; regolamento UE 2022/2065, art. 16)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Chi segnala. La persona a cui si riferisce il contenuto segnalato"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Tipo di contenuto, pagina, motivo, nome (facoltativo), email di chi segnala"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Casella info@ (non al singolo gestore, perché uno dei due è anche infermiere iscritto). Brevo, Aruba"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Non entrano nel database. Restano nella casella info@ per il tempo che serve a gestirle. [DA DECIDERE: durata precisa, per esempio 12 mesi dalla decisione]"
      }
    ]
  },
  {
    "titolo": "Registro anti-abuso",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Contare i tentativi ravvicinati (prenotazioni, iscrizioni, invii di moduli) e fermare i robot"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Legittimo interesse alla sicurezza (art. 6.1.f)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Chiunque invii un modulo"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Indirizzo IP e tipo di azione, con data e ora"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Nessuno. Render"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "24 ore. La cancellazione parte a ogni nuovo invio di un modulo"
      }
    ]
  },
  {
    "titolo": "Copie di sicurezza (backup)",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Poter ripristinare il sito se il fornitore ha un guasto"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Obbligo di sicurezza (art. 32) e legittimo interesse alla continuità del servizio (art. 6.1.f)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Tutti gli interessati presenti nel database"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Copia delle tabelle principali del database"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Casella info@ (Aruba), spedita da Brevo. La chiave per aprirla la custodiscono solo i contitolari"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "No"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "90 giorni nella casella info@"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "Copia compressa e cifrata (AES-256). Senza la chiave il sito non spedisce niente: meglio una copia in meno che una copia in chiaro"
      },
      {
        "voce": "Punti aperti",
        "contenuto": "1) La cancellazione automatica dopo 90 giorni non è ancora costruita: oggi va fatta a mano. 2) Il vecchio database Neon (account di Eduard), con i dati fermi al 29/10/2026, va cancellato"
      }
    ]
  },
  {
    "titolo": "Statistiche di visita (Google Analytics)",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Capire quali pagine vengono visitate e da dove arrivano i visitatori"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Consenso dal banner dei cookie (art. 6.1.a; art. 122 del Codice privacy)"
      },
      {
        "voce": "Chi riguarda",
        "contenuto": "Visitatori che accettano i cookie statistici"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Pagine viste, provenienza, tipo di dispositivo, identificativo del cookie. I codici dei link personali vengono tolti prima dell'invio. Alla fine di una prenotazione parte solo il segnale «prenotazione completata»: né la prestazione né l'infermiere"
      },
      {
        "voce": "A chi vanno",
        "contenuto": "Google"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "Sì, Stati Uniti. Copertura: decisione di adeguatezza UE-USA (Data Privacy Framework) e clausole standard"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "[DA COMPILARE: durata impostata nel pannello di Analytics, 2 o 14 mesi]"
      },
      {
        "voce": "Sicurezza specifica",
        "contenuto": "Analytics si carica solo dopo il consenso. «Rifiuta» ha lo stesso rilievo di «Accetta». La scelta si cambia dal link in fondo a ogni pagina"
      }
    ]
  },
  {
    "titolo": "Conteggio delle visite alla scheda",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Dare all'infermiere il numero di visite alla sua scheda"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Legittimo interesse (art. 6.1.f)"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Un numero al giorno per ogni infermiere. Nessun dato di chi visita"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Finché il profilo è in rete"
      }
    ]
  },
  {
    "titolo": "Mappa (OpenStreetMap)",
    "voci": [
      {
        "voce": "A cosa serve",
        "contenuto": "Mostrare la mappa in home e nella pagina di ricerca"
      },
      {
        "voce": "Base giuridica",
        "contenuto": "Legittimo interesse a mostrare dove operano gli infermieri (art. 6.1.f)"
      },
      {
        "voce": "Quali dati",
        "contenuto": "Il browser del visitatore scarica le immagini della mappa dai server di OpenStreetMap, che quindi vedono il suo indirizzo IP. Nessun cookie di profilazione"
      },
      {
        "voce": "Fuori dall'UE",
        "contenuto": "Regno Unito (decisione di adeguatezza)"
      },
      {
        "voce": "Per quanto restano",
        "contenuto": "Non conserviamo niente"
      }
    ]
  },
  {
    "titolo": "Trattamenti spenti",
    "voci": [
      {
        "voce": "Diario infermieristico",
        "contenuto": "tolto dal sito. Nel database restano due tabelle vuote. [DA VERIFICARE: che siano davvero vuote; poi eliminarle]. Se un giorno torna, prima serve una valutazione d'impatto (documento 6)."
      },
      {
        "voce": "Abbonamenti a pagamento",
        "contenuto": "spenti. Quando partiranno, aggiungere qui i dati di fatturazione e il fornitore dei pagamenti."
      }
    ]
  }
];

export const SEME_VIOLAZIONI = [
  {
    "titolo": "1/2026 — sito non raggiungibile dal 27 al 29 ottobre 2026",
    "voci": [
      {
        "voce": "Scoperta",
        "contenuto": "28/10/2026, su segnalazione di uno dei contitolari che ha trovato il sito in errore. [DA COMPILARE: ora]"
      },
      {
        "voce": "Periodo",
        "contenuto": "Dal 27/10/2026 alle 02:51 circa (ora italiana) al 29/10/2026 alle 16:27. Due momenti distinti, descritti sotto"
      },
      {
        "voce": "Cosa è successo",
        "contenuto": "Primo momento (27-28/10). Il database, allora presso il fornitore Neon, si è spento perché era finita la quota mensile del piano gratuito. Tutte le pagine che leggono il database davano errore. Restavano visibili solo le pagine fisse. Il fornitore lo ha riacceso la sera del 28/10, dopo il passaggio al piano a pagamento. Secondo momento (29/10). Alle 9:43 il fornitore dell'hosting (Render) ha sospeso il servizio per una fattura non pagata. Il sito è tornato attivo alle 16:01, dopo il pagamento. Lo stesso giorno, alle 16:26, il database è stato spostato da Neon a Render (fermo di circa due minuti)"
      },
      {
        "voce": "Tipo",
        "contenuto": "Disponibilità (temporanea). Nessuna perdita di riservatezza né di integrità"
      },
      {
        "voce": "Dati coinvolti",
        "contenuto": "Tutti i dati del database: prenotazioni dei pazienti, account e schede dei professionisti, candidature, recensioni. I dati non sono stati né persi né visti da estranei: non erano raggiungibili"
      },
      {
        "voce": "Quante persone",
        "contenuto": "Circa 40 professionisti iscritti a quella data e i pazienti con prenotazioni in corso. [DA COMPILARE: numero di prenotazioni con appuntamento fra il 27 e il 29/10, da leggere nel pannello]"
      },
      {
        "voce": "Causa",
        "contenuto": "Organizzativa, non un attacco. 1) Il sito è cresciuto e ha superato i limiti del piano gratuito del database. 2) Fattura dell'hosting rimasta non pagata. In entrambi i casi mancava un avviso preventivo"
      },
      {
        "voce": "Conseguenze",
        "contenuto": "Per circa due giorni e mezzo: i pazienti non potevano prenotare, disdire o rivedere le prenotazioni dal sito; gli infermieri non potevano aprire l'agenda. Non sono partiti i promemoria automatici. Le conferme già spedite via email restavano valide, e paziente e infermiere avevano i contatti l'uno dell'altro nelle email. Il backup della notte del 27/10 non è partito; quello del 26/10 era buono, quello del 29/10 è riuscito. Nessun dato perso: il confronto fra il vecchio e il nuovo database dopo il trasloco ha dato copia identica (27 tabelle, 2.537 righe)"
      },
      {
        "voce": "Rimedi immediati",
        "contenuto": "Passaggio del database al piano a pagamento (28/10). Pagamento della fattura dell'hosting (29/10). Trasloco del database su Render, a costo fisso e senza quota che spegne il servizio (29/10). Email di scuse a tutti gli infermieri iscritti (29/10, 35 destinatari)"
      },
      {
        "voce": "Valutazione del rischio",
        "contenuto": "Improbabile. Motivi: nessun dato perso o divulgato; fermo temporaneo; il sito non eroga cure e non è un servizio di emergenza; gli appuntamenti già fissati restavano gestibili con i contatti nelle email di conferma. [DA CONFERMARE con l'avvocato]"
      },
      {
        "voce": "Notifica al Garante",
        "contenuto": "No. Motivo: rischio improbabile per i diritti e le libertà delle persone (art. 33.1). [DA CONFERMARE con l'avvocato. Nota: le 72 ore sono già passate; se l'avvocato ritenesse dovuta la notifica, va fatta subito spiegando il ritardo]"
      },
      {
        "voce": "Avviso agli interessati",
        "contenuto": "Non dovuto. Agli infermieri è stata comunque mandata l'email di scuse del 29/10. Ai pazienti nessun avviso"
      },
      {
        "voce": "Rimedi definitivi",
        "contenuto": "Fatti: database e sito presso lo stesso fornitore, a costo fisso; backup notturno verificato funzionante dopo il trasloco (controllo del 12/11/2026). Da fare: 1) avviso di scadenza per le fatture dei fornitori e carta di riserva [DA COMPILARE: chi se ne occupa]; 2) portare tutti i servizi sull'account del progetto, non su account personali; 3) cancellare il vecchio database Neon, dove restano i dati fermi al 29/10/2026"
      },
      {
        "voce": "Compilato da",
        "contenuto": "[DA COMPILARE: nome] — 12/11/2026"
      }
    ]
  }
];
