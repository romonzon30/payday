const mongoose = require("mongoose");

const DueDateSchema = new mongoose.Schema({
  title: String,
  date: String,
  type: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("DueDate", DueDateSchema);