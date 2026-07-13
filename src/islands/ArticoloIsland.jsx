import React from "react";
import Shell from "./Shell.jsx";
import Articolo from "../views/Articolo.jsx";

export default function ArticoloIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Articolo />
    </Shell>
  );
}
