const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  tenantId: { type: Number },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  iscompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
