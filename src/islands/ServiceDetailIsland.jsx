import React from "react";
import Shell from "./Shell.jsx";
import ServiceDetail from "../views/ServiceDetail.jsx";

export default function ServiceDetailIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <ServiceDetail />
    </Shell>
  );
}
