const router = require("express").Router();
const DueDate = require("../models/DueDate");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const dueDates = await DueDate.find({
      userId: req.user.id,
    });

    res.json(dueDates);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const dueDate = new DueDate({
      title: req.body.title,
      date: req.body.date,
      type: req.body.type,
      userId: req.user.id,
    });

    await dueDate.save();

    res.json(dueDate);
  } catch (err) {
    res.status(500).json(err);
  }
});


const createMonotributoDueDates = require("../utils/createMonotributoDueDates");

router.post("/generate-monotributo", auth, async (req, res) => {
  try {
    const existing = await DueDate.findOne({
      userId: req.user.id,
      category: "Monotributo",
    });

    if (existing) {
      return res.json({
        message: "Los vencimientos de monotributo ya existen",
      });
    }

    await createMonotributoDueDates(req.user.id);

    res.json({
      message: "Vencimientos de monotributo generados",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error generando vencimientos",
    });
  }
});

module.exports = router;