const router = require("express").Router();
const DueDate = require("../models/DueDate");

router.get("/", async (req, res) => {
  try {
    const dueDates = await DueDate.find().sort({ date: 1 });
    res.json(dueDates);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener vencimientos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, category, date } = req.body;

    const newDueDate = new DueDate({
      title,
      description,
      category,
      date,
    });

    await newDueDate.save();

    res.json(newDueDate);
  } catch (err) {
    res.status(500).json({ message: "Error al crear vencimiento" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await DueDate.findByIdAndDelete(req.params.id);
    res.json({ message: "Vencimiento eliminado" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar vencimiento" });
  }
});

module.exports = router;