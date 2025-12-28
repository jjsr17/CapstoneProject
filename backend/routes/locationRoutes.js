const express = require("express");
const Location = require("../models/Location");

const router = express.Router();

router.get("/", async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

router.post("/", async (req, res) => {
  try {
    const location = new Location(req.body);
    const saved = await location.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
