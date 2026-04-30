import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import ChiSiamo from "./pages/ChiSiamo";
import StructureDetail from "./pages/StructureDetail";
import Structures from "./pages/Structures";
import Domicilio from "./pages/Domicilio";
import Recensioni from "./pages/Recensioni";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/domicilio" element={<Domicilio />} />
      <Route path="/servizio/:serviceId" element={<ServiceDetail />} />
      <Route path="/chi-siamo" element={<ChiSiamo />} />
      <Route path="/strutture" element={<Structures />} />
      <Route path="/struttura/:structureId" element={<StructureDetail />} />
      <Route path="/recensioni" element={<Recensioni />} />
    </Routes>
  );
}