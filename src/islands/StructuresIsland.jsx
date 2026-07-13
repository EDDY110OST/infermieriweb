import React from "react";
import Shell from "./Shell.jsx";
import Structures from "../views/Structures.jsx";

export default function StructuresIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Structures />
    </Shell>
  );
}
