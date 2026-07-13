import React from "react";
import Shell from "./Shell.jsx";
import StructureDetail from "../views/StructureDetail.jsx";

export default function StructureDetailIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <StructureDetail />
    </Shell>
  );
}
