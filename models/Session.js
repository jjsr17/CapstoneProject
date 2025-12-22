const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  roomId: { type: String },
  mode: { type: Number }   // 1 = online, 2 = in-person, etc.
}, { timestamps: true });

module.exports = mongoose.model("Session", SessionSchema);
