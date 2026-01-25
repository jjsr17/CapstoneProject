import express from "express";
import User from "../../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const data = req.body;

    if (!data.accountType || !["student", "educator"].includes(data.accountType)) {
      return res.status(400).json({ ok: false, message: "Invalid accountType." });
    }
    if (!data.user_email) {
      return res.status(400).json({ ok: false, message: "Email is required (user_email)." });
    }
    if (!data.firstName || !data.lastName) {
      return res.status(400).json({ ok: false, message: "First and last name are required." });
    }

    const user = await User.create({
      accountType: data.accountType,

      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,

      gender: data.gender ?? "",
      age: data.age !== undefined && data.age !== "" ? Number(data.age) : undefined,
      birthDate: data.birthDate,

      address: data.address,
      town: data.town,
      stateField: data.stateField || data.state,
      country: data.country,

      phone: data.phone,

      user_email: String(data.user_email).toLowerCase().trim(),

      student: data.accountType === "student" ? data.student : undefined,
      educator: data.accountType === "educator" ? data.educator : undefined,
    });

    res.status(201).json({ ok: true, userId: user._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ ok: false, message: "Email already exists." });
    }
    res.status(500).json({ ok: false, message: err.message });
  }
});


export default router;
