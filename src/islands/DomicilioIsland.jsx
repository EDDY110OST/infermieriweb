import React from "react";
import Shell from "./Shell.jsx";
import Domicilio from "../views/Domicilio.jsx";

export default function DomicilioIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Domicilio />
    </Shell>
  );
}
