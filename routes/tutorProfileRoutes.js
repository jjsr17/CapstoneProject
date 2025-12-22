const express = require("express");
const TutorProfile = require("../models/TutorProfile");

const router = express.Router();

// GET all tutor profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await TutorProfile.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new tutor profile
router.post("/", async (req, res) => {
  try {
    const profile = new TutorProfile(req.body);
    const saved = await profile.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
