-- Consensi della prenotazione registrati lato server (GDPR art. 7.1: il titolare
-- deve poter DIMOSTRARE che l'interessato ha prestato il consenso).
-- Prima la spunta era obbligatoria nel form ma non veniva salvata da nessuna parte.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent_privacy_at timestamp with time zone;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent_health_at  timestamp with time zone;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consent_text       text NOT NULL DEFAULT ''::text;

COMMENT ON COLUMN bookings.consent_privacy_at IS 'Quando il paziente ha accettato l''informativa privacy';
COMMENT ON COLUMN bookings.consent_health_at  IS 'Consenso esplicito art. 9 GDPR (solo prestazioni a domicilio: la prestazione puo indicare un esigenza di salute)';
COMMENT ON COLUMN bookings.consent_text       IS 'Testo esatto della spunta accettata, per prova';
