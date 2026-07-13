import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Leaflet tocca `window` al caricamento: questo modulo viene importato
// dinamicamente da StructureDetail solo nel browser.

const createFlagIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        font-size: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        border: 3px solid #0066cc;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: pulse 2s infinite;
      ">
        🚩
      </div>
    `,
    iconSize: [40, 40],
    className: "custom-div-icon",
  });
};

export default function StructureMap({ structure }) {
  return (
    <MapContainer
      center={structure.coordinates}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={structure.coordinates} icon={createFlagIcon()}>
        <Popup>
          <strong>{structure.name}</strong>
          <br />
          {structure.address}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
