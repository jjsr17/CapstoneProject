
const mongoose = require("mongoose");

const TutorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subjects: [{ type: Number }],      // list of subject codes
  tutor_rate: { type: String },
  tutor_rating: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("TutorProfile", TutorProfileSchema);
