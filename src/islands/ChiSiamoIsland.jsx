import React from "react";
import Shell from "./Shell.jsx";
import ChiSiamo from "../views/ChiSiamo.jsx";

export default function ChiSiamoIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <ChiSiamo />
    </Shell>
  );
}
