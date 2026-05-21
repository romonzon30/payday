const mongoose = require("mongoose");

const DueDateSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    date: String,
    status: {
      type: String,
      default: "pendiente",
    },
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DueDate", DueDateSchema);