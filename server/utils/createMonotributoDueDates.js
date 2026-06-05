const DueDate = require("../models/DueDate");
const { getNextBusinessDay } = require("./businessDays");

async function createMonotributoDueDates(userId) {
  const year = 2026;

  const dueDates = [];

  for (let month = 0; month < 12; month++) {
    const baseDate = new Date(year, month, 20);
    const finalDate = getNextBusinessDay(baseDate);

    dueDates.push({
      title: "AFIP - Monotributo",
      description: "Vencimiento mensual de monotributo",
      category: "Monotributo",
      date: finalDate,
      status: "pendiente",
      userId,
    });
  }

  await DueDate.insertMany(dueDates);
}

module.exports = createMonotributoDueDates;