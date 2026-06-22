// ── Argentine Tax Calendar 2026 ──────────────────────────────
// Source: Errepar Calendario de Vencimientos 2026
// baseDia: base day of month; actual date = next business day on or after baseDia
// digits: CUIT last digits that belong to this group

const IMPUESTOS = [
  {
    id: "autonomos",
    nombre: "Autónomos",
    descripcion: "Aportes jubilatorios y obra social para trabajadores autónomos",
    categoria: "aportes",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 6 },
      { digits: [4, 5, 6],    baseDia: 7 },
      { digits: [7, 8, 9],    baseDia: 8 },
    ],
  },
  {
    id: "sicoss",
    nombre: "Empleadores (SICOSS)",
    descripcion: "Contribuciones patronales y aportes de empleados en relación de dependencia",
    categoria: "empleadores",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 9 },
      { digits: [4, 5, 6],    baseDia: 10 },
      { digits: [7, 8, 9],    baseDia: 11 },
    ],
  },
  {
    id: "anticipos",
    nombre: "Anticipos – Ganancias / Bienes Personales",
    descripcion: "Anticipos de Ganancias Personas Humanas, Bienes Personales y Fondo Cooperativo",
    categoria: "ganancias",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 13 },
      { digits: [4, 5, 6],    baseDia: 14 },
      { digits: [7, 8, 9],    baseDia: 15 },
    ],
  },
  {
    id: "ganancias_soc",
    nombre: "Ganancias Sociedades (DDJJ)",
    descripcion: "Anticipo mensual del Impuesto a las Ganancias para sociedades",
    categoria: "ganancias",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 13 },
      { digits: [4, 5, 6],    baseDia: 14 },
      { digits: [7, 8, 9],    baseDia: 15 },
    ],
  },
  {
    id: "convenio_multilateral",
    nombre: "Convenio Multilateral",
    descripcion: "DDJJ mensual para actividades económicas en varias jurisdicciones",
    categoria: "provincial",
    grupos: [
      { digits: [0, 1, 2],    baseDia: 15 },
      { digits: [3, 4, 5],    baseDia: 16 },
      { digits: [6, 7],       baseDia: 20 },
      { digits: [8, 9],       baseDia: 21 },
    ],
  },
  {
    id: "iva",
    nombre: "IVA (DDJJ mensual)",
    descripcion: "Declaración jurada mensual del Impuesto al Valor Agregado",
    categoria: "impuestos",
    grupos: [
      { digits: [0, 1],    baseDia: 19 },
      { digits: [2, 3],    baseDia: 20 },
      { digits: [4, 5],    baseDia: 21 },
      { digits: [6, 7],    baseDia: 22 },
      { digits: [8, 9],    baseDia: 23 },
    ],
  },
  {
    id: "internos",
    nombre: "Impuestos Internos (exc. cigarrillos)",
    descripcion: "DDJJ mensual de Impuestos Internos",
    categoria: "impuestos",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 23 },
      { digits: [4, 5, 6],    baseDia: 24 },
      { digits: [7, 8, 9],    baseDia: 25 },
    ],
  },
  {
    id: "sicore_1ra",
    nombre: "SICORE/SIRE – 1ª quincena",
    descripcion: "Retenciones y percepciones impositivas de la 1ª quincena del mes corriente",
    categoria: "retenciones",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 21 },
      { digits: [4, 5, 6],    baseDia: 22 },
      { digits: [7, 8, 9],    baseDia: 23 },
    ],
  },
  {
    id: "sicore_2da",
    nombre: "SICORE/SIRE – 2ª quincena",
    descripcion: "Retenciones y percepciones impositivas de la 2ª quincena del mes anterior",
    categoria: "retenciones",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 9 },
      { digits: [4, 5, 6],    baseDia: 10 },
      { digits: [7, 8, 9],    baseDia: 11 },
    ],
  },
  {
    id: "casas_particulares",
    nombre: "Personal de Casas Particulares",
    descripcion: "Contribuciones obligatorias del personal doméstico",
    categoria: "empleadores",
    grupos: [
      { digits: [0, 1, 2, 3], baseDia: 12 },
      { digits: [4, 5, 6],    baseDia: 13 },
      { digits: [7, 8, 9],    baseDia: 14 },
    ],
  },
];

module.exports = { IMPUESTOS };
