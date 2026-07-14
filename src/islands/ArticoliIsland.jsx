import React from "react";
import Shell from "./Shell.jsx";
import Articoli from "../views/Articoli.jsx";

export default function ArticoliIsland({ pathname, params, articles }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Articoli articles={articles} />
    </Shell>
  );
}
