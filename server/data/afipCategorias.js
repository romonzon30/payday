// AFIP monotributo categories (2026). Single source of truth for seeding.

const CATEGORIAS_AFIP = [
  { categoria: "A", montoMensual: 42386.74, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 748382.07,   costoPorCarga: 0 },
  { categoria: "B", montoMensual: 48250.78, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 1122573.10,  costoPorCarga: 0 },
  { categoria: "C", montoMensual: 56501.85, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 1870955.17,  costoPorCarga: 12500 },
  { categoria: "D", montoMensual: 72414.10, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 2806432.76,  costoPorCarga: 14000 },
  { categoria: "E", montoMensual: 102537.97, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 3741910.34,  costoPorCarga: 18000 },
  { categoria: "F", montoMensual: 129045.32, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 4677387.93,  costoPorCarga: 22000 },
  { categoria: "G", montoMensual: 197108.23, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 5612865.51,  costoPorCarga: 32000 },
  { categoria: "H", montoMensual: 447346.93, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 6548343.10,  costoPorCarga: 65000 },
  { categoria: "I", montoMensual: 824802.26, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 9354758.68,  costoPorCarga: 110000 },
  { categoria: "J", montoMensual: 999007.65, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 11241282.00, costoPorCarga: 135000 },
  { categoria: "K", montoMensual: 1381687.90, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 15000000.00, costoPorCarga: 175000 },
];

module.exports = { CATEGORIAS_AFIP };
