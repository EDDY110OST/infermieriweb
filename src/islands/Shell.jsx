import React from "react";
import { AppSettingsProvider } from "../contexts/AppContext.jsx";
import { RouteProvider } from "../lib/router-shim.jsx";

// Involucro comune delle isole: fornisce impostazioni app (lingua/tema)
// e il contesto di route (pathname + params) alle viste React.
export default function Shell({ pathname, params, children }) {
  return (
    <AppSettingsProvider>
      <RouteProvider pathname={pathname} params={params}>
        {children}
      </RouteProvider>
    </AppSettingsProvider>
  );
}
