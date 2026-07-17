import React, { useState } from "react";

// Campo password con icona "occhio" per mostrare/nascondere ciò che si digita
// (o ciò che il browser propone in automatico). Riusabile in tutti i form.
export default function CampoPassword({ id, value, onChange, autoComplete = "current-password", required = true, minLength, placeholder }) {
  const [vedi, setVedi] = useState(false);
  return (
    <div className="pf-pass-wrap">
      <input
        id={id}
        type={vedi ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pf-pass-input"
      />
      <button
        type="button"
        className="pf-pass-eye"
        onClick={() => setVedi((v) => !v)}
        aria-label={vedi ? "Nascondi password" : "Mostra password"}
        title={vedi ? "Nascondi password" : "Mostra password"}
        tabIndex={-1}
      >
        {vedi ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
