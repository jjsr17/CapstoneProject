// backend/routes/authRoutes.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * DEV-ONLY: decode a JWT payload WITHOUT verifying signature.
 * Production: verify using Microsoft JWKS.
 */
function decodeJwtPayload(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length < 2) throw new Error("Invalid JWT");

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);

  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function pickEmail(claims) {
  return (
    claims.preferred_username ||
    claims.upn ||
    claims.email ||
    (Array.isArray(claims.emails) ? claims.emails[0] : null) ||
    null
  );
}

function splitNameFromClaims(claims) {
  const givenName = claims.given_name || "";
  const familyName = claims.family_name || "";
  const fullName = claims.name || "";

  const [fallbackFirst = "", ...rest] = String(fullName).split(" ");
  const fallbackLast = rest.join(" ");

  return {
    firstName: givenName || fallbackFirst || "Microsoft",
    lastName: familyName || fallbackLast || "User",
  };
}

function publicUser(user) {
  return {
    _id: user._id.toString(),
    user_email: user.user_email,
    accountType: user.accountType,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

function bearerToken(req) {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * POST /auth/ms-login
 * Header: Authorization: Bearer <id_token>
 */
router.post("/ms-login", async (req, res) => {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing Bearer token" });

    const claims = decodeJwtPayload(token);

    const emailRaw = pickEmail(claims);
    if (!emailRaw) {
      return res.status(400).json({
        ok: false,
        message: "Could not find email in Microsoft token claims",
        hint: "Expected preferred_username/upn/email/emails[0]",
      });
    }

    const email = String(emailRaw).trim().toLowerCase();
    const defaultAccountType = "student";

    let user = await User.findOne({ user_email: email });

    if (!user) {
      const { firstName, lastName } = splitNameFromClaims(claims);
      user = await User.create({
        accountType: defaultAccountType,
        firstName,
        lastName,
        user_email: email,
      });
    } else {
      // Optional: refresh placeholder names
      const { firstName, lastName } = splitNameFromClaims(claims);
      if (firstName && (!user.firstName || user.firstName === "Microsoft")) user.firstName = firstName;
      if (lastName && (!user.lastName || user.lastName === "User")) user.lastName = lastName;
      await user.save();
    }

    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    console.error("ms-login error:", err);
    return res.status(500).json({
      ok: false,
      message: "ms-login crashed",
      error: err.message,
    });
  }
});

/**
 * POST /auth/signup
 * Body supports:
 *  - email OR user_email
 *  - accountType
 *  - firstName
 *  - lastName
 *
 * This is currently IDPOTENT: if the email exists, it returns that user (201 ok: true).
 * If you want "real signup" (409 if exists), tell me and I’ll flip it.
 */
router.post("/signup", async (req, res) => {
  try {
    console.log("SIGNUP headers:", req.headers["content-type"]);
    console.log("SIGNUP body:", req.body);

    const body = req.body || {};

    const email = String(body.email || body.user_email || "").trim().toLowerCase();
    const accountType = String(body.accountType || "").trim();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();

    if (!email) return res.status(400).json({ ok: false, message: "Email is required" });
    if (!["student", "educator"].includes(accountType)) {
      return res.status(400).json({ ok: false, message: "accountType must be 'student' or 'educator'" });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ ok: false, message: "firstName and lastName are required" });
    }

    let user = await User.findOne({ user_email: email });

    if (!user) {
      user = await User.create({
        accountType,
        firstName,
        lastName,
        user_email: email,
      });
    } else {
      // Optional: if they "signup" again, you can keep profile fields fresh
      // (comment out if you don't want this behavior)
      if (!user.firstName) user.firstName = firstName;
      if (!user.lastName) user.lastName = lastName;
      if (!user.accountType) user.accountType = accountType;
      await user.save();
    }

    return res.status(201).json({ ok: true, user: publicUser(user) });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ ok: false, message: "signup crashed", error: err.message });
  }
});

module.exports = router;
