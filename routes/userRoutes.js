// routes/userRoutes.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /api/users  -> get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/users -> create a new user
router.post("/", async (req, res) => {
  try {
    const { tenantId, user_role, user_status, user_name, user_email } = req.body;

    const user = new User({
      tenantId,
      user_role,
      user_status,
      user_name,
      user_email,
    });

    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Bad request", error: err.message });
  }
});

module.exports = router;
