import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import ChiSiamo from "./pages/ChiSiamo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/servizio/:serviceId" element={<ServiceDetail />} />
      <Route path="/chi-siamo" element={<ChiSiamo />} />
    </Routes>
  );
}