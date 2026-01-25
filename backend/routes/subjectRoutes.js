// backend/routes/subjectRoutes.js
const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");

// GET /api/subjects?query=math
router.get("/", async (req, res) => {
  try {
    const q = (req.query.query || "").trim();

    const filter = q
      ? { subject_name: { $regex: q, $options: "i" } }
      : {};

    const subjects = await Subject.find(filter)
      .sort({ subject_name: 1 })
      .lean();

    res.json(subjects);
  } catch (err) {
    console.error("GET /api/subjects failed:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/subjects  (optional: insert subjects from Postman/Atlas testing)
router.post("/", async (req, res) => {
  try {
    const created = await Subject.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
