import React from "react";
import Shell from "./Shell.jsx";
import LavoraConNoi from "../views/LavoraConNoi.jsx";

export default function LavoraConNoiIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <LavoraConNoi />
    </Shell>
  );
}
