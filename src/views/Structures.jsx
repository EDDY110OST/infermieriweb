import React from "react";
import { MdLocalHospital, MdHealthAndSafety, MdLocalPharmacy } from "react-icons/md";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { Link } from "react-router-dom";
import "../styles/Structures.css";

const structures = [
  {
    id: "eurofins",
    name: "Eurofins Lamm",
    address: "Via Cavalletti, 183, 55100 Lucca LU",
    phone: "0583581491",
    icon: <MdLocalHospital className="structure-icon-svg" />,
  },
  {
    id: "centro_medico_d33",
    name: "Centro Medico D33",
    address: "Via di Salicchi, 978, 55100 Lucca LU",
    phone: "05831527791",
    icon: <MdHealthAndSafety className="structure-icon-svg" />,
  },
  {
    id: "farmacia_comunale",
    name: "Farmacia Comunale 24h Lucca",
    address: "Piazza Curtatone, 7, 55100 Lucca LU",
    phone: "0583491398",
    icon: <MdLocalPharmacy className="structure-icon-svg" />,
  },
];

export default function Structures() {
  const { t } = useAppSettings();

  return (
    <>
      <section className="structures-page">
        <div className="structures-header">
          <h1>{t("pages.structures.title")}</h1>
          <p>{t("pages.structures.description")}</p>
        </div>

        <div className="structures-list">
          {structures.map((structure) => (
            <Link
              key={structure.id}
              to={`/struttura/${structure.id}`}
              className="structure-item-link"
            >
              <div className="structure-item">
                <div className="structure-icon">{structure.icon}</div>
                <div className="structure-details">
                  <h2>{structure.name}</h2>
                  <p className="address">
                    📍 {structure.address}
                  </p>
                  <p className="phone">
                    📞 {structure.phone}
                  </p>
                </div>
                <div className="structure-arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
