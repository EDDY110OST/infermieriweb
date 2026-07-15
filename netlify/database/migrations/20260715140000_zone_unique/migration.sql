-- Niente comuni doppi per lo stesso professionista (protegge anche dalle race)
DELETE FROM coverage_areas a USING coverage_areas b
WHERE a.professional_id = b.professional_id
  AND lower(a.city) = lower(b.city) AND a.id > b.id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_coverage_prof_city
  ON coverage_areas (professional_id, lower(city));
