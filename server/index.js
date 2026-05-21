const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dueDateRoutes = require("./routes/dueDates");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/due-dates", dueDateRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch((err) => console.log(err));

app.listen(5000, () => {
  console.log("Servidor corriendo en puerto 5000");
});