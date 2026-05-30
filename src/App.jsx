import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import "./App.css";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import ChiSiamo from "./pages/ChiSiamo";
import StructureDetail from "./pages/StructureDetail";
import Structures from "./pages/Structures";
import Domicilio from "./pages/Domicilio";
import Recensioni from "./pages/Recensioni";
import LavoraConNoi from "./pages/LavoraConNoi";
import Articoli from "./pages/Articoli";
import Articolo from "./pages/Articolo";

ReactGA.initialize("G-7M0H77LRX2");

export default function App() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/domicilio" element={<Domicilio />} />
      <Route path="/servizio/:serviceId" element={<ServiceDetail />} />
      <Route path="/chi-siamo" element={<ChiSiamo />} />
      <Route path="/strutture" element={<Structures />} />
      <Route path="/struttura/:structureId" element={<StructureDetail />} />
      <Route path="/recensioni" element={<Recensioni />} />
      <Route path="/articoli" element={<Articoli />} />
      <Route path="/articoli/:slug" element={<Articolo />} />
      <Route path="/lavora-con-noi" element={<LavoraConNoi />} />
    </Routes>
  );
}