const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

router.get("/", async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

router.post("/", async (req, res) => {
  try {
    const message = new Message(req.body);
    const saved = await message.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
