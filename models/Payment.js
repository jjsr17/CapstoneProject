const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  provider: { type: String },      // Stripe, PayPal, Flutterwave, etc.
  intentId: { type: Number },
  status: { type: String }         // pending, paid, failed
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
