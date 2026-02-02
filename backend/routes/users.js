import express from "express";
import User from "../../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const data = req.body || {};

    const accountType = String(data.accountType || "").trim().toLowerCase();
    if (!["student", "educator"].includes(accountType)) {
      return res.status(400).json({ ok: false, message: "Invalid accountType." });
    }

    const email = String(data.user_email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ ok: false, message: "Email is required (user_email)." });
    }

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    if (!firstName || !lastName) {
      return res.status(400).json({ ok: false, message: "First and last name are required." });
    }

    const user = await User.create({
      accountType,

      firstName,
      middleName: data.middleName || "",
      lastName,

      gender: data.gender ?? "",
      age: data.age !== undefined && data.age !== "" ? Number(data.age) : undefined,
      birthDate: data.birthDate || "",

      address: data.address || "",
      town: data.town || "",
      stateField: data.stateField || data.state || "",
      country: data.country || "",

      phone: data.phone || "",

      user_email: email,

      student: accountType === "student" ? data.student : undefined,
      educator: accountType === "educator" ? data.educator : undefined,

      // If your schema has it, keep it; otherwise remove these two lines
      profileComplete: true,
      authProvider: data.authProvider || "local",
    });

    // ✅ Return what the frontend needs (user id + role)
    return res.status(201).json({
      ok: true,
      user: {
        _id: user._id,
        accountType: user.accountType,
        profileComplete: user.profileComplete ?? true,
        firstName: user.firstName,
        lastName: user.lastName,
        user_email: user.user_email,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ ok: false, message: "Email already exists." });
    }
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
});
// routes/users.js
router.post("/ms-login", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) return res.status(401).json({ ok: false, message: "Missing token" });

    // TODO: verify token + extract email
    // For now assume you have email somehow:
    const email = req.body?.email; // <- replace this with verified token claim
    if (!email) return res.status(400).json({ ok: false, message: "Missing email" });

    const user = await User.findOne({ user_email: String(email).toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ ok: false, needsSignup: true });
    }

    return res.json({
      ok: true,
      user: {
        _id: user._id,
        accountType: user.accountType,
        profileComplete: user.profileComplete,
        firstName: user.firstName,
        lastName: user.lastName,
        user_email: user.user_email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});


export default router;
