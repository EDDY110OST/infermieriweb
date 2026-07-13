import React, { createContext, useContext } from "react";

// Sostituisce react-router-dom nel sito statico: i link diventano <a> veri
// (navigazione a pagine piene), pathname e params arrivano dalla route Astro.

const RouteContext = createContext({ pathname: "/", params: {} });

export function RouteProvider({ pathname = "/", params = {}, children }) {
  return (
    <RouteContext.Provider value={{ pathname, params }}>
      {children}
    </RouteContext.Provider>
  );
}

const normalize = (path) => {
  if (!path) return "/";
  const clean = String(path).split("#")[0].split("?")[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
};

export function useLocation() {
  const { pathname } = useContext(RouteContext);
  return { pathname, search: "", hash: "" };
}

export function useParams() {
  return useContext(RouteContext).params;
}

export function Link({ to, children, ...rest }) {
  return (
    <a href={typeof to === "string" ? to : to?.pathname || "/"} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, end, className, style, children, ...rest }) {
  const { pathname } = useContext(RouteContext);
  const target = normalize(typeof to === "string" ? to : to?.pathname || "/");
  const current = normalize(pathname);
  const isActive = end || target === "/" ? current === target : current === target || current.startsWith(`${target}/`);

  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;
  const resolvedStyle = typeof style === "function" ? style({ isActive }) : style;

  return (
    <a href={target} className={resolvedClass || undefined} style={resolvedStyle} aria-current={isActive ? "page" : undefined} {...rest}>
      {children}
    </a>
  );
}
