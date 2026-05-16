const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  picture: String,
});

module.exports = mongoose.model("User", UserSchema);