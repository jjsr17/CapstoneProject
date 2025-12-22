// routes/sessionRoutes.js
const express = require("express");
const Session = require("../models/Session");

const router = express.Router();

// GET /api/sessions  -> get all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions  -> create a new session
router.post("/", async (req, res) => {
  try {
    const session = new Session(req.body); // expects bookingId, roomId, mode in body
    const saved = await session.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
