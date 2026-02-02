// backend/routes/messageRoutes.js
const express = require("express");
const mongoose = require("mongoose");

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Booking = require("../models/Booking");

const router = express.Router();

/* ---------------- helpers ---------------- */

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getMeId(req) {
  const id = req.header("x-user-id") || req.query.userId || req.body.userId;
  return isValidObjectId(id) ? String(id) : null;
}

function requireMe(req, res) {
  const meId = getMeId(req);
  if (!meId) {
    res.status(400).json({ error: "Missing x-user-id (current user id)" });
    return null;
  }
  return meId;
}

function displayName(u) {
  if (!u) return "Unknown";
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.user_email || "Unknown";
}

/**
 * Finds or creates a 1:1 conversation between two users.
 */
async function findOrCreateDM(meId, otherId) {
  let convo = await Conversation.findOne({
    isGroup: { $ne: true },
    participants: { $all: [meId, otherId] },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
  });

  if (!convo) {
    convo = await Conversation.create({
      participants: [meId, otherId],
      isGroup: false,
      lastMessageText: "",
      lastMessageAt: null,
    });
  }
  return convo;
}

/**
 * Returns the set of "allowed chat userIds" based on bookings.
 * If I'm a student, I can chat with tutors I booked.
 * If I'm a tutor, I can chat with students who booked me.
 */
async function getBookedCounterpartIds(meId) {
  const meObjId = new mongoose.Types.ObjectId(meId);

  const bookings = await Booking.find({
    $or: [{ studentId: meObjId }, { tutorId: meObjId }],
  })
    .select({ studentId: 1, tutorId: 1 })
    .lean();

  const ids = new Set();
  for (const b of bookings) {
    const s = b.studentId ? String(b.studentId) : null;
    const t = b.tutorId ? String(b.tutorId) : null;

    if (s && s !== meId) ids.add(s);
    if (t && t !== meId) ids.add(t);
  }
  return Array.from(ids);
}

/* ---------------- routes ---------------- */

/**
 * GET /api/messages/contacts
 * Contacts = users I've booked with.
 * Also auto-creates Conversations so your UI can immediately open chat.
 */
router.get("/contacts", async (req, res) => {
  try {
    const meId = requireMe(req, res);
    if (!meId) return;

    const counterpartIds = await getBookedCounterpartIds(meId);

    if (counterpartIds.length === 0) return res.json([]);

    // Load users in one query
    const users = await User.find({ _id: { $in: counterpartIds } })
      .select({ firstName: 1, lastName: 1, user_email: 1 })
      .lean();

    // For each allowed user, ensure convo exists and return contact row
    const results = [];
    for (const u of users) {
      const otherId = String(u._id);
      const convo = await findOrCreateDM(meId, otherId);

      results.push({
        conversationId: String(convo._id),
        userId: otherId,
        name: displayName(u),
        lastMessageText: convo.lastMessageText || "",
        lastMessageAt: convo.lastMessageAt || null,
      });
    }

    // Sort newest conversations first
    results.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    return res.json(results);
  } catch (err) {
    console.error("GET /contacts error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * OPTIONAL:
 * POST /api/messages/conversations
 * Body: { otherUserId }
 * Opens a DM ONLY if you have a booking relationship.
 */
router.post("/conversations", async (req, res) => {
  try {
    const meId = requireMe(req, res);
    if (!meId) return;

    const { otherUserId } = req.body;
    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ error: "Invalid otherUserId" });
    }
    if (String(otherUserId) === String(meId)) {
      return res.status(400).json({ error: "Cannot create conversation with yourself" });
    }

    // Enforce booking relationship
    const allowedIds = await getBookedCounterpartIds(meId);
    if (!allowedIds.includes(String(otherUserId))) {
      return res.status(403).json({ error: "You can only message users you have booked with." });
    }

    const other = await User.findById(otherUserId).lean();
    if (!other) return res.status(404).json({ error: "User not found" });

    const convo = await findOrCreateDM(meId, String(otherUserId));

    return res.json({
      conversationId: String(convo._id),
      name: displayName(other),
    });
  } catch (err) {
    console.error("POST /conversations error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/messages/:conversationId
 * Participant-only
 */
router.get("/:conversationId", async (req, res) => {
  try {
    const meId = requireMe(req, res);
    if (!meId) return;

    const { conversationId } = req.params;
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ error: "Invalid conversationId" });
    }

    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const isParticipant = (convo.participants || []).some((p) => String(p) === String(meId));
    if (!isParticipant) return res.status(403).json({ error: "Not allowed" });

    const msgs = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(
      msgs.map((m) => ({
        _id: String(m._id),
        text: m.text || "",
        type: m.type || "text",
        senderId: m.senderId ? String(m.senderId) : null,
        sender: String(m.senderId) === String(meId) ? "me" : "them",
        createdAt: m.createdAt,
      }))
    );
  } catch (err) {
    console.error("GET /:conversationId error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/messages/send
 * Body: { conversationId, text }
 * Participant-only
 */
router.post("/send", async (req, res) => {
  try {
    const meId = requireMe(req, res);
    if (!meId) return;

    const { conversationId, text } = req.body;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ error: "Invalid conversationId" });
    }

    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return res.status(400).json({ error: "Message text required" });
    }

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const isParticipant = (convo.participants || []).some((p) => String(p) === String(meId));
    if (!isParticipant) return res.status(403).json({ error: "Not allowed" });

    const msg = await Message.create({
      conversationId,
      senderId: meId,
      text: cleanText,
      type: "text",
    });

    convo.lastMessageText = cleanText;
    convo.lastMessageAt = new Date();
    await convo.save();

    return res.status(201).json({ ok: true, messageId: String(msg._id), createdAt: msg.createdAt });
  }catch (err) {
  console.error("contacts error:", err);
  return res.status(500).json({ error: err.message || "Server error" });
}
});

module.exports = router;
