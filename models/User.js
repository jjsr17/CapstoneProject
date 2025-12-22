// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    tenantId: { type: Number },
    user_role: { type: String },   // student, tutor, admin, etc.
    user_status: { type: String }, // active, banned, pending...
    user_name: { type: String, required: true },
    user_email: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
