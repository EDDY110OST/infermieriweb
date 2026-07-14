-- Blog nel database: gli articoli si gestiscono da /admin senza toccare il codice.
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  reading_time TEXT NOT NULL DEFAULT '',
  body_raw TEXT NOT NULL DEFAULT '',
  sections JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft', -- draft|published
  published_at DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$quanto-costa-infermiere-domicilio-lucca$s$, $t$Quanto costa un infermiere a domicilio a Lucca?$t$, $c$Assistenza Domiciliare$c$, $e$Scopri i principali fattori che determinano il prezzo dell'assistenza infermieristica a domicilio a Lucca e provincia.$e$,
       $i$$i$, $r$4 min$r$, $b$## Quanto costa un infermiere a domicilio a Lucca?

Sempre più persone scelgono l'assistenza infermieristica a domicilio per ricevere cure professionali senza dover uscire di casa.

Ma quanto costa un infermiere a domicilio a Lucca? La risposta dipende da diversi fattori, tra cui il tipo di prestazione richiesta, la durata dell'intervento e la frequenza degli accessi.

## Da cosa dipende il costo di un infermiere a domicilio?

Il costo di una prestazione infermieristica può variare in base a diversi aspetti specifici, che influenzano il preventivo finale.

Scopriamo i principali elementi da considerare quando si calcola il prezzo di un infermiere a domicilio.

## Tipologia di prestazione

Prestazioni semplici come iniezioni o medicazioni di base hanno generalmente un costo inferiore rispetto a servizi più complessi come:

- Gestione catetere vescicale

- Gestione stomie

- Medicazioni avanzate

- Fleboclisi

- Monitoraggi specialistici

## Durata dell'intervento

Alcune prestazioni richiedono pochi minuti, mentre altre necessitano di una permanenza più lunga presso il domicilio del paziente.

La durata influisce direttamente sul costo, perché aumenta il tempo di presenza dell'infermiere e la complessità dell'assistenza.

## Zona di intervento

La distanza e l'area geografica possono influire sul costo finale, soprattutto per interventi in comuni più lontani dal centro di Lucca.

Nel calcolo del prezzo si può tenere conto anche del tempo di viaggio e delle eventuali spese accessorie per raggiungere il domicilio.

## Frequenza delle prestazioni

In caso di assistenza continuativa o accessi programmati, possono essere valutate soluzioni personalizzate.

Gli interventi ricorrenti possono beneficiare di preventivi su misura, pensati per garantire continuità e risparmio.

## Prezzi indicativi delle principali prestazioni infermieristiche

Di seguito alcuni esempi indicativi:

- Iniezioni: da 20 €

- Medicazioni semplici: da 30 €

- Medicazioni complesse: da 40 €

- ECG a domicilio: da 50 €

- Fleboclisi: da 35 €

- Gestione catetere vescicale: da 40 €

- Gestione stomia: da 40 €

- Piano assistenziale personalizzato: su valutazione

I costi possono variare in base alla complessità del caso e alle specifiche esigenze del paziente.

## Quando conviene richiedere un infermiere a domicilio?

L'assistenza infermieristica domiciliare è particolarmente utile per:

- Persone anziane con difficoltà negli spostamenti

- Pazienti dimessi recentemente dall'ospedale

- Persone con patologie croniche

- Pazienti che necessitano di controlli periodici

- Familiari che desiderano un supporto professionale a casa

## Perché scegliere InfermieriWeb?

InfermieriWeb collabora con infermieri qualificati e regolarmente iscritti all'Ordine Professionale.

Offriamo:

- Professionalità e puntualità

- Assistenza personalizzata

- Disponibilità a Lucca e provincia

- Supporto domiciliare rapido

- Ampia gamma di prestazioni infermieristiche

## Richiedi un preventivo gratuito

Se desideri conoscere il costo esatto della prestazione di cui hai bisogno, contattaci senza impegno.

Valuteremo insieme la situazione e ti forniremo un preventivo chiaro e personalizzato per le tue esigenze.$b$, $j$[{"id":"introduzione","title":"Quanto costa un infermiere a domicilio a Lucca?","content":["Sempre più persone scelgono l'assistenza infermieristica a domicilio per ricevere cure professionali senza dover uscire di casa.","Ma quanto costa un infermiere a domicilio a Lucca? La risposta dipende da diversi fattori, tra cui il tipo di prestazione richiesta, la durata dell'intervento e la frequenza degli accessi."]},{"id":"dipende-da","title":"Da cosa dipende il costo di un infermiere a domicilio?","content":["Il costo di una prestazione infermieristica può variare in base a diversi aspetti specifici, che influenzano il preventivo finale.","Scopriamo i principali elementi da considerare quando si calcola il prezzo di un infermiere a domicilio."]},{"id":"tipologia-di-prestazione","title":"Tipologia di prestazione","content":["Prestazioni semplici come iniezioni o medicazioni di base hanno generalmente un costo inferiore rispetto a servizi più complessi come:","- Gestione catetere vescicale","- Gestione stomie","- Medicazioni avanzate","- Fleboclisi","- Monitoraggi specialistici"]},{"id":"durata-intervento","title":"Durata dell'intervento","content":["Alcune prestazioni richiedono pochi minuti, mentre altre necessitano di una permanenza più lunga presso il domicilio del paziente.","La durata influisce direttamente sul costo, perché aumenta il tempo di presenza dell'infermiere e la complessità dell'assistenza."]},{"id":"zona-intervento","title":"Zona di intervento","content":["La distanza e l'area geografica possono influire sul costo finale, soprattutto per interventi in comuni più lontani dal centro di Lucca.","Nel calcolo del prezzo si può tenere conto anche del tempo di viaggio e delle eventuali spese accessorie per raggiungere il domicilio."]},{"id":"frequenza-prestazioni","title":"Frequenza delle prestazioni","content":["In caso di assistenza continuativa o accessi programmati, possono essere valutate soluzioni personalizzate.","Gli interventi ricorrenti possono beneficiare di preventivi su misura, pensati per garantire continuità e risparmio."]},{"id":"prezzi-indicativi","title":"Prezzi indicativi delle principali prestazioni infermieristiche","content":["Di seguito alcuni esempi indicativi:","- Iniezioni: da 20 €","- Medicazioni semplici: da 30 €","- Medicazioni complesse: da 40 €","- ECG a domicilio: da 50 €","- Fleboclisi: da 35 €","- Gestione catetere vescicale: da 40 €","- Gestione stomia: da 40 €","- Piano assistenziale personalizzato: su valutazione","I costi possono variare in base alla complessità del caso e alle specifiche esigenze del paziente."]},{"id":"quando-conviene","title":"Quando conviene richiedere un infermiere a domicilio?","content":["L'assistenza infermieristica domiciliare è particolarmente utile per:","- Persone anziane con difficoltà negli spostamenti","- Pazienti dimessi recentemente dall'ospedale","- Persone con patologie croniche","- Pazienti che necessitano di controlli periodici","- Familiari che desiderano un supporto professionale a casa"]},{"id":"perche-scegliere","title":"Perché scegliere InfermieriWeb?","content":["InfermieriWeb collabora con infermieri qualificati e regolarmente iscritti all'Ordine Professionale.","Offriamo:","- Professionalità e puntualità","- Assistenza personalizzata","- Disponibilità a Lucca e provincia","- Supporto domiciliare rapido","- Ampia gamma di prestazioni infermieristiche"]},{"id":"preventivo-gratuito","title":"Richiedi un preventivo gratuito","content":["Se desideri conoscere il costo esatto della prestazione di cui hai bisogno, contattaci senza impegno.","Valuteremo insieme la situazione e ti forniremo un preventivo chiaro e personalizzato per le tue esigenze."]}]$j$::jsonb,
       'published', $d$2026-05-15$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$quanto-costa-infermiere-domicilio-lucca$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$ecg-a-domicilio-come-funziona$s$, $t$ECG a domicilio: come funziona e quando è utile$t$, $c$ECG$c$, $e$Spieghiamo come si svolge un ECG a domicilio, i suoi vantaggi e quando è consigliato per la tua salute cardiaca.$e$,
       $i$/images/ecg-domicilio-lucca.webp$i$, $r$5 min$r$, $b$## Cos'è un ECG a domicilio?

L'ECG a domicilio è un elettrocardiogramma eseguito direttamente nella tua abitazione, senza bisogno di recarti in ambulatorio.

È ideale per pazienti con mobilità ridotta o per chi preferisce evitare spostamenti e attese ospedaliere.

## Quando è utile eseguire un ECG a casa

Questa prestazione è utile in caso di palpitazioni, dolori al petto, svenimenti o per monitorare patologie cardiache già note.

L'infermiere prepara il paziente, applica gli elettrodi e registra il tracciato in sicurezza e comfort.

## Vantaggi dell'ECG domiciliare

Nessuna attesa in ambulatorio, ambiente familiare, supporto personalizzato e referto disponibile in tempi rapidi.

InfermiereWeb ti accompagna nella prestazione con professionalità, assistenza e puntualità all'interno di Lucca e provincia.$b$, $j$[{"id":"ecg-domiciliare","title":"Cos'è un ECG a domicilio?","content":["L'ECG a domicilio è un elettrocardiogramma eseguito direttamente nella tua abitazione, senza bisogno di recarti in ambulatorio.","È ideale per pazienti con mobilità ridotta o per chi preferisce evitare spostamenti e attese ospedaliere."]},{"id":"quando","title":"Quando è utile eseguire un ECG a casa","content":["Questa prestazione è utile in caso di palpitazioni, dolori al petto, svenimenti o per monitorare patologie cardiache già note.","L'infermiere prepara il paziente, applica gli elettrodi e registra il tracciato in sicurezza e comfort."]},{"id":"vantaggi","title":"Vantaggi dell'ECG domiciliare","content":["Nessuna attesa in ambulatorio, ambiente familiare, supporto personalizzato e referto disponibile in tempi rapidi.","InfermiereWeb ti accompagna nella prestazione con professionalità, assistenza e puntualità all'interno di Lucca e provincia."]}]$j$::jsonb,
       'published', $d$2026-05-20$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$ecg-a-domicilio-come-funziona$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$prelievi-sangue-a-domicilio$s$, $t$Prelievi del sangue a domicilio: tutto quello che devi sapere$t$, $c$Prelievi$c$, $e$Tutto sui prelievi a domicilio: preparazione, sicurezza, quando preferirli e come richiedere il servizio a Lucca.$e$,
       $i$/images/prelievi-domicilio-lucca.webp$i$, $r$4 min$r$, $b$## Come prepararsi a un prelievo a domicilio

Prima del prelievo è importante seguire le indicazioni del medico: digiuno, idratazione e sospensione di alcuni farmaci se richiesto.

Il nostro infermiere arriva attrezzato e garantisce igiene, precisione e un processo rapido.

## Perché scegliere il prelievo a domicilio

È una soluzione comoda per anziani, persone con difficoltà motorie o pazienti fragili che preferiscono restare a casa.

Riduce lo stress da spostamento e permette di evitare lunghe attese in laboratorio.

## Risultati e referto

Il campione viene consegnato ai laboratori convenzionati in tempi rapidi e il referto viene poi condiviso secondo le modalità concordate.

In caso di urgenze, il nostro servizio può adeguarsi alle esigenze del paziente e del medico curante.$b$, $j$[{"id":"preparazione","title":"Come prepararsi a un prelievo a domicilio","content":["Prima del prelievo è importante seguire le indicazioni del medico: digiuno, idratazione e sospensione di alcuni farmaci se richiesto.","Il nostro infermiere arriva attrezzato e garantisce igiene, precisione e un processo rapido."]},{"id":"vantaggi-prelievo","title":"Perché scegliere il prelievo a domicilio","content":["È una soluzione comoda per anziani, persone con difficoltà motorie o pazienti fragili che preferiscono restare a casa.","Riduce lo stress da spostamento e permette di evitare lunghe attese in laboratorio."]},{"id":"risultati","title":"Risultati e referto","content":["Il campione viene consegnato ai laboratori convenzionati in tempi rapidi e il referto viene poi condiviso secondo le modalità concordate.","In caso di urgenze, il nostro servizio può adeguarsi alle esigenze del paziente e del medico curante."]}]$j$::jsonb,
       'published', $d$2026-05-10$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$prelievi-sangue-a-domicilio$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$medicazioni-semplici-e-complesse$s$, $t$Medicazioni semplici e complesse: differenze e indicazioni$t$, $c$Medicazioni$c$, $e$Scopri quando richiedere medicazioni semplici o complesse a domicilio e come InfermieriWeb garantisce sicurezza e cura personalizzata.$e$,
       $i$/images/medicazione-domiciliare-lucca.webp$i$, $r$5 min$r$, $b$## Medicazioni semplici e complesse: le differenze

Le medicazioni semplici riguardano piccole ferite, punture o cambi di medicazione già prescritta.

Le medicazioni complesse includono lesioni croniche, ulcere da decubito, ferite chirurgiche e necessitano di protocolli avanzati.

## Quando ricorrere a un infermiere a domicilio

Richiedi un infermiere a domicilio quando la ferita richiede assistenza professionale, igiene rigorosa e monitoraggio costante.

Il nostro team valuta ogni caso con attenzione e propone la soluzione più adeguata.

## I vantaggi dell'assistenza a casa

L'assistenza a domicilio offre comfort, diminuisce il rischio di infezioni in ambienti esterni e favorisce la guarigione con un piano personalizzato.

Garantiamo materiali sterili, competenza infermieristica e supporto costante alla famiglia.$b$, $j$[{"id":"tipologie","title":"Medicazioni semplici e complesse: le differenze","content":["Le medicazioni semplici riguardano piccole ferite, punture o cambi di medicazione già prescritta.","Le medicazioni complesse includono lesioni croniche, ulcere da decubito, ferite chirurgiche e necessitano di protocolli avanzati."]},{"id":"quando-ricorrere","title":"Quando ricorrere a un infermiere a domicilio","content":["Richiedi un infermiere a domicilio quando la ferita richiede assistenza professionale, igiene rigorosa e monitoraggio costante.","Il nostro team valuta ogni caso con attenzione e propone la soluzione più adeguata."]},{"id":"vantaggi","title":"I vantaggi dell'assistenza a casa","content":["L'assistenza a domicilio offre comfort, diminuisce il rischio di infezioni in ambienti esterni e favorisce la guarigione con un piano personalizzato.","Garantiamo materiali sterili, competenza infermieristica e supporto costante alla famiglia."]}]$j$::jsonb,
       'published', $d$2026-05-05$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$medicazioni-semplici-e-complesse$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$catetere-vescicale-sostituzione-gestione$s$, $t$Catetere vescicale: quando sostituirlo e come gestirlo$t$, $c$Cateteri$c$, $e$Guida completa alla sostituzione e gestione del catetere vescicale a domicilio, con consigli pratici e indicazioni professionali.$e$,
       $i$$i$, $r$5 min$r$, $b$## Quando è necessario sostituire il catetere

La sostituzione è richiesta quando il catetere è otturato, fuoriuscito o dopo un periodo concordato con il medico.

Un infermiere professionista effettua la sostituzione in modo sterile e sicuro a domicilio.

## Come gestire il catetere quotidiano

La cura del catetere prevede pulizia regolare, controllo del serbatoio e osservazione di eventuali segni di infezione.

Offriamo istruzioni chiare ai caregiver e supporto continuo per garantire il massimo comfort.$b$, $j$[{"id":"sostituzione","title":"Quando è necessario sostituire il catetere","content":["La sostituzione è richiesta quando il catetere è otturato, fuoriuscito o dopo un periodo concordato con il medico.","Un infermiere professionista effettua la sostituzione in modo sterile e sicuro a domicilio."]},{"id":"gestione","title":"Come gestire il catetere quotidiano","content":["La cura del catetere prevede pulizia regolare, controllo del serbatoio e osservazione di eventuali segni di infezione.","Offriamo istruzioni chiare ai caregiver e supporto continuo per garantire il massimo comfort."]}]$j$::jsonb,
       'published', $d$2026-05-18$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$catetere-vescicale-sostituzione-gestione$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$gestione-della-stomia-a-domicilio$s$, $t$Gestione della stomia a domicilio$t$, $c$Stomie$c$, $e$Scopri le migliori pratiche per la cura della stomia a domicilio e come un infermiere specializzato può fare la differenza.$e$,
       $i$$i$, $r$5 min$r$, $b$## Cura della stomia a casa

La gestione della stomia richiede attenzione all'igiene, alla tenuta dell'apparecchio e al controllo delle cute peristomale.

Il nostro infermiere valuta ogni cambiamento e garantisce una procedura delicata e rispettosa.

## Supporto personalizzato per il paziente

Forniamo supporto nella scelta dei prodotti, nelle tecniche di cambio e nella prevenzione di complicanze.

La cura a domicilio rende più semplice il mantenimento della routine quotidiana.$b$, $j$[{"id":"cura-stomia","title":"Cura della stomia a casa","content":["La gestione della stomia richiede attenzione all'igiene, alla tenuta dell'apparecchio e al controllo delle cute peristomale.","Il nostro infermiere valuta ogni cambiamento e garantisce una procedura delicata e rispettosa."]},{"id":"supporto","title":"Supporto personalizzato per il paziente","content":["Forniamo supporto nella scelta dei prodotti, nelle tecniche di cambio e nella prevenzione di complicanze.","La cura a domicilio rende più semplice il mantenimento della routine quotidiana."]}]$j$::jsonb,
       'published', $d$2026-05-12$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$gestione-della-stomia-a-domicilio$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$holter-cardiaco-pressorio-differenze$s$, $t$Holter cardiaco e pressorio: differenze e utilizzo$t$, $c$Holter$c$, $e$Capisci quando è utile un holter cardiaco o pressorio e quali vantaggi offre il monitoraggio a domicilio.$e$,
       $i$$i$, $r$6 min$r$, $b$## Holter cardiaco

L'holter cardiaco registra l'attività elettrica del cuore per un periodo prolungato, utile per analizzare aritmie e sintomi intermittenti.

Il dispositivo viene applicato comodamente a domicilio e il referto viene elaborato da un cardiologo.

## Holter pressorio

L'holter pressorio monitora la pressione arteriosa durante le 24 ore, misurando i valori in diverse situazioni quotidiane.

È indicato per valutare l'ipertensione non controllata, l'efficacia dei farmaci e i picchi pressori.$b$, $j$[{"id":"holter-cardiaco","title":"Holter cardiaco","content":["L'holter cardiaco registra l'attività elettrica del cuore per un periodo prolungato, utile per analizzare aritmie e sintomi intermittenti.","Il dispositivo viene applicato comodamente a domicilio e il referto viene elaborato da un cardiologo."]},{"id":"holter-pressorio","title":"Holter pressorio","content":["L'holter pressorio monitora la pressione arteriosa durante le 24 ore, misurando i valori in diverse situazioni quotidiane.","È indicato per valutare l'ipertensione non controllata, l'efficacia dei farmaci e i picchi pressori."]}]$j$::jsonb,
       'published', $d$2026-05-22$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$holter-cardiaco-pressorio-differenze$s$);

INSERT INTO articles (slug, title, category, excerpt, image, reading_time, body_raw, sections, status, published_at)
SELECT $s$quando-richiedere-assistenza-infermieristica-domiciliare$s$, $t$Quando richiedere un'assistenza infermieristica domiciliare$t$, $c$Assistenza Domiciliare$c$, $e$Vediamo i segnali più comuni che indicano la necessità di un infermiere a domicilio e come organizzare il servizio su Lucca.$e$,
       $i$/images/iniezioni-domicilio-lucca.webp$i$, $r$4 min$r$, $b$## Quando richiederla

L'assistenza domiciliare è utile in caso di difficoltà motorie, post-operatorio, gestione della stomia, fleboclisi o necessità di medicazioni regolari.

Anche le persone anziane o con patologie croniche beneficiano di un infermiere a domicilio per mantenere continuità e sicurezza.

## Come organizzare il servizio

Contattaci via WhatsApp per descrivere la tua esigenza: ti aiuteremo a scegliere prestazioni, orari e frequenza più adatti.

La nostra rete di infermieri a Lucca lavora con professionalità e rispetto della privacy.$b$, $j$[{"id":"segnali","title":"Quando richiederla","content":["L'assistenza domiciliare è utile in caso di difficoltà motorie, post-operatorio, gestione della stomia, fleboclisi o necessità di medicazioni regolari.","Anche le persone anziane o con patologie croniche beneficiano di un infermiere a domicilio per mantenere continuità e sicurezza."]},{"id":"organizzazione","title":"Come organizzare il servizio","content":["Contattaci via WhatsApp per descrivere la tua esigenza: ti aiuteremo a scegliere prestazioni, orari e frequenza più adatti.","La nostra rete di infermieri a Lucca lavora con professionalità e rispetto della privacy."]}]$j$::jsonb,
       'published', $d$2026-05-08$d$::date
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE slug = $s$quando-richiedere-assistenza-infermieristica-domiciliare$s$);

