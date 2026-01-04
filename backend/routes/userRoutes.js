// routes/userRoutes.js (final polished)
// - CommonJS (matches your server.js)
// - Accepts `email` OR `user_email`
// - Saves hashed password to `passwordHash`
// - Writes nested `student` / `educator` objects matching your UserSchema
// - Clean validation + safe response payload

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const ACCOUNT_TYPES = ["student", "educator"];
const GENDERS = ["Male", "Female", "Other", ""];

function pickString(v, fallback = "") {
  return typeof v === "string" ? v.trim() : fallback;
}

function pickNumber(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeEmail(p) {
  const raw = (p?.user_email ?? p?.email ?? "").toString().trim();
  return raw ? raw.toLowerCase() : "";
}

function validateSignupPayload(p) {
  if (!p || typeof p !== "object") return "Missing request body";

  const accountType = pickString(p.accountType);
  if (!ACCOUNT_TYPES.includes(accountType)) return "accountType must be 'student' or 'educator'";

  const firstName = pickString(p.firstName);
  const lastName = pickString(p.lastName);
  if (!firstName || !lastName) return "firstName and lastName are required";

  const email = normalizeEmail(p);
  if (!email) return "Email is required";

  const password = p.password;
  if (!password || typeof password !== "string") return "password is required";
  if (password.length < 6) return "password must be at least 6 characters";

  const gender = p.gender ?? "";
  if (!GENDERS.includes(gender)) return "gender must be 'Male', 'Female', 'Other', or ''";

  // Optional: enforce nested object based on account type
  // if (accountType === "student" && !p.student) return "student object is required for student accountType";
  // if (accountType === "educator" && !p.educator) return "educator object is required for educator accountType";

  return null;
}

function buildUserDoc(p) {
  const accountType = pickString(p.accountType);
  const email = normalizeEmail(p);

  const doc = {
    tenantId: p.tenantId ?? 0,

    accountType,
    user_role: pickString(p.user_role, "user"),
    user_status: pickString(p.user_status, "active"),

    firstName: pickString(p.firstName),
    middleName: pickString(p.middleName),
    lastName: pickString(p.lastName),

    gender: p.gender ?? "",
    age: pickNumber(p.age),
    birthDate: pickString(p.birthDate),

    address: pickString(p.address),
    town: pickString(p.town),
    stateField: pickString(p.stateField),
    country: pickString(p.country),

    phone: pickString(p.phone),

    user_email: email, // ✅ matches schema
    // passwordHash set separately
  };

  // ✅ Nested objects matching your schema fields
  if (accountType === "student") {
    const s = p.student && typeof p.student === "object" ? p.student : {};
    doc.student = {
      schoolName: pickString(s.schoolName),
      educationLevel: pickString(s.educationLevel),
      grade: pickString(s.grade),
      collegeYear: pickString(s.collegeYear),
      concentration: pickString(s.concentration),
      degreeType: pickString(s.degreeType),
    };
  } else if (accountType === "educator") {
    const e = p.educator && typeof p.educator === "object" ? p.educator : {};
    doc.educator = {
      collegeName: pickString(e.collegeName),
      degree: pickString(e.degree),
      concentration: pickString(e.concentration),
      credentialsFileName: pickString(e.credentialsFileName),
    };
  }

  return doc;
}

// GET /api/users -> list users (consider removing in production)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/users/signup -> create user
router.post("/signup", async (req, res) => {
  try {
    const p = req.body;

    // 1) Validate
    const validationError = validateSignupPayload(p);
    if (validationError) return res.status(400).json({ message: validationError });

    const email = normalizeEmail(p);

    // 2) Duplicate check
    const exists = await User.findOne({ user_email: email }).select("_id").lean();
    if (exists) return res.status(409).json({ message: "Email already exists" });

    // 3) Build doc + hash password
    const userDoc = buildUserDoc(p);
    userDoc.passwordHash = await bcrypt.hash(p.password, 12);

    // 4) Save
    const saved = await User.create(userDoc);

    // 5) Return minimal safe payload
    return res.status(201).json({
      message: "Signup ok",
      user: {
        id: saved._id,
        accountType: saved.accountType,
        firstName: saved.firstName,
        lastName: saved.lastName,
        user_email: saved.user_email,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
