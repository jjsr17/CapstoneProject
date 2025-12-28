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
// routes/userRoutes.js
router.post("/signup", async (req, res) => {
  try {
    const p = req.body;

    // Basic validation
    if (!p.accountType) return res.status(400).json({ message: "accountType is required" });
    if (!p.firstName || !p.lastName) return res.status(400).json({ message: "Name is required" });
    if (!p.email) return res.status(400).json({ message: "Email is required" });

    // Build doc
    const user = new User({
      tenantId: p.tenantId ?? 0,
      accountType: p.accountType,

      user_role: p.accountType, // optional: mirrors accountType
      user_status: "active",

      firstName: p.firstName,
      middleName: p.middleName,
      lastName: p.lastName,

      gender: p.gender,
      age: p.age ? Number(p.age) : undefined,
      birthDate: p.birthDate,

      address: p.address,
      town: p.town,
      stateField: p.stateField,
      country: p.country,

      phone: p.phone,
      user_email: p.email,

      student: p.accountType === "student"
        ? {
            schoolName: p.schoolName,
            educationLevel: p.educationLevel,
            grade: p.grade,
            collegeYear: p.collegeYear,
            concentration: p.studentConcentration,
            degreeType: p.degreeType,
          }
        : undefined,

      educator: p.accountType === "educator"
        ? {
            collegeName: p.educatorCollegeName,
            degree: p.educatorDegree,
            concentration: p.educatorConcentration,
            // credentialsFileName: (later when you upload)
          }
        : undefined,
    });

    const saved = await user.save();
    return res.status(201).json({ message: "Signup ok", user: saved });
  } catch (err) {
    // duplicate email
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(400).json({ message: "Bad request", error: err.message });
  }
});


module.exports = router;
