import React from "react";
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaTiktok, FaYoutube } from "react-icons/fa";

// Icone social. Rese staticamente da Astro (nessun JS lato client).
const ICONE = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  linkedin: FaLinkedinIn,
  tiktok: FaTiktok,
  youtube: FaYoutube,
};

// variant "default" = pastiglie tonde colorate (pagina); "header" = icone
// monocromatiche piccole per la barra bianca in alto (a colori solo in hover).
export default function SocialBar({ links = [], variant = "default", size = 20 }) {
  const attivi = links.filter((l) => l && l.href);
  if (!attivi.length) return null;
  const wrap = variant === "header" ? "pf-social-header" : "pf-social";
  const item = variant === "header" ? "pf-social-ic" : "pf-social-link";
  return (
    <div className={wrap}>
      {attivi.map((l) => {
        const I = ICONE[l.ic];
        return (
          <a
            key={l.ic}
            href={l.href}
            className={item}
            aria-label={l.nome}
            target="_blank"
            rel="noopener noreferrer"
          >
            {I ? <I size={size} aria-hidden="true" /> : l.nome}
          </a>
        );
      })}
    </div>
  );
}
