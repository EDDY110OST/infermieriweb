-- Nomi prestazioni uniformati alla tabella ufficiale dei soci (18/7/26).
-- Le key/catalog_key non cambiano; si allineano solo i nomi visibili, così la
-- stessa dicitura compare su /domicilio, nelle schede e nel pannello. Aggiorna
-- anche i nomi liberi inseriti dai primi infermieri.
UPDATE services SET name = 'Iniezione IM'                    WHERE catalog_key = 'iniezione-im';
UPDATE services SET name = 'Iniezione SC'                    WHERE catalog_key = 'iniezione-sc';
UPDATE services SET name = 'Flebo'                           WHERE catalog_key = 'flebo';
UPDATE services SET name = 'Prelievo'                        WHERE catalog_key = 'prelievo';
UPDATE services SET name = 'Somministrazione terapia orale'  WHERE catalog_key = 'terapia-orale';
UPDATE services SET name = 'Medicazione semplice'            WHERE catalog_key = 'medicazione-semplice';
UPDATE services SET name = 'Medicazione complessa'           WHERE catalog_key = 'medicazione-complessa';
UPDATE services SET name = 'Sondino naso-gastrico'           WHERE catalog_key = 'sondino-ng';
UPDATE services SET name = 'Rimozione punti'                 WHERE catalog_key = 'rimozione-punti';
UPDATE services SET name = 'Posizionamento catetere'         WHERE catalog_key = 'posizionamento-catetere';
UPDATE services SET name = 'Sostituzione catetere'           WHERE catalog_key = 'sostituzione-catetere';
UPDATE services SET name = 'Gestione stomia'                 WHERE catalog_key = 'gestione-stomia';
UPDATE services SET name = 'Clistere'                        WHERE catalog_key = 'clistere';
UPDATE services SET name = 'ECG'                             WHERE catalog_key = 'ecg';
UPDATE services SET name = 'Holter pressorio'                WHERE catalog_key = 'holter-pressorio';
UPDATE services SET name = 'Holter cardiaco'                 WHERE catalog_key = 'holter-cardiaco';
UPDATE services SET name = 'Parametri vitali'                WHERE catalog_key = 'parametri-vitali';
UPDATE services SET name = 'Gestione PEG'                    WHERE catalog_key = 'gestione-peg';
UPDATE services SET name = 'Educazione terapeutica'          WHERE catalog_key = 'educazione-terapeutica';
UPDATE services SET name = 'Medicazione CVC'                 WHERE catalog_key = 'medicazione-cvc';
UPDATE services SET name = 'Pianificazione sanitaria'        WHERE catalog_key = 'pianificazione-sanitaria';
UPDATE services SET name = 'Assistenza personalizzata all''ora' WHERE catalog_key = 'assistenza-oraria';
UPDATE services SET name = 'Lavaggio auricolare'             WHERE catalog_key = 'lavaggio-auricolare';
