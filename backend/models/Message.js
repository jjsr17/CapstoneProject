const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String },   // text, image, file, etc.
  text: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
