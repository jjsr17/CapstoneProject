// models/Synonym.js
const mongoose = require("mongoose");

const SynonymSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    synonyms: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Synonym", SynonymSchema);
