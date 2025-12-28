// models/Location.js
const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    urb: { type: String, required: true },
    range: { type: String, required: true },
    street: { type: String, required: true },
    aptSte: { type: String }, // instead of "apt-ste"
    state: { type: String, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", LocationSchema);
