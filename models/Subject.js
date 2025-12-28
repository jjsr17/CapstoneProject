const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  code: { type: Number },
  subject_name: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Subject", SubjectSchema);
