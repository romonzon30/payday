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

module.exports = router;