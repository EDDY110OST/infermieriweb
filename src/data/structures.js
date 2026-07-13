// Strutture convenzionate: usate dalla vista StructureDetail e dalle route statiche.

export const structuresData = {
  eurofins: {
    name: "Eurofins Lamm",
    address: "Via Cavalletti, 183, 55100 Lucca LU",
    phone: "0583581491",
    coordinates: [43.8347, 10.4981],
  },
  centro_medico_d33: {
    name: "Centro Medico D33",
    address: "Via di Salicchi, 978, 55100 Lucca LU",
    phone: "05831527791",
    coordinates: [43.8328, 10.5082],
  },
  farmacia_comunale: {
    name: "Farmacia Comunale 24h Lucca",
    address: "Piazza Curtatone, 7, 55100 Lucca LU",
    phone: "0583491398",
    coordinates: [43.8375, 10.5015],
  },
};

export const structureIds = Object.keys(structuresData);
