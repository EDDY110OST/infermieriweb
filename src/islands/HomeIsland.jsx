import React from "react";
import Shell from "./Shell.jsx";
import Home from "../views/Home.jsx";

export default function HomeIsland({ pathname, params }) {
  return (
    <Shell pathname={pathname} params={params}>
      <Home />
    </Shell>
  );
}
