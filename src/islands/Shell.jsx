import React from "react";
import { RouteProvider } from "../lib/router-shim.jsx";

// Involucro comune delle isole del blog: fornisce solo il contesto di route
// (pathname + params) alle viste React. La vecchia impalcatura multilingua
// (AppSettingsProvider + translations.js) è stata rimossa: il sito è solo in italiano.
export default function Shell({ pathname, params, children }) {
  return (
    <RouteProvider pathname={pathname} params={params}>
      {children}
    </RouteProvider>
  );
}
