import React from "react";
import Shell from "./Shell.jsx";
import Articolo from "../views/Articolo.jsx";

export default function ArticoloIsland({ pathname, params, article, related }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Articolo article={article} related={related} />
    </Shell>
  );
}
