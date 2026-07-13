import React from "react";
import Shell from "./Shell.jsx";
import Recensioni from "../views/Recensioni.jsx";

export default function RecensioniIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Recensioni />
    </Shell>
  );
}
