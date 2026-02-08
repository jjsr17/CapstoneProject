const express = require("express");
const Subject = require("../models/Subject");

const router = express.Router();

router.get("/", async (req, res) => {
  const subjects = await Subject.find();
  res.json(subjects);
});

router.post("/", async (req, res) => {
  try {
    const subject = new Subject(req.body);
    const saved = await subject.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
