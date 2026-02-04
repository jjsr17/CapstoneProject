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
router.get("/debug/teams/:otherUserId", async (req, res) => {
  const meId = requireMe(req, res);
  if (!meId) return;

  const { otherUserId } = req.params;
  if (!isValidObjectId(otherUserId)) {
    return res.status(400).json({ error: "Invalid otherUserId" });
  }

  const me = await User.findById(meId).select({ authProvider: 1, msOid: 1, teamsEnabled: 1, user_email: 1 }).lean();
  const other = await User.findById(otherUserId).select({ authProvider: 1, msOid: 1, teamsEnabled: 1, user_email: 1 }).lean();

  return res.json({ me, other });
});

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
    const me = await User.findById(meId)
      .select({ authProvider: 1, msOid: 1, teamsEnabled: 1 })
      .lean();

    const isTeamsUser = (u) =>
      !!u && u.authProvider === "microsoft" && !!u.msOid && u.teamsEnabled === true;

    const meTeams = isTeamsUser(me);

    if (counterpartIds.length === 0) return res.json([]);

    // Load users in one query
 const users = await User.find({ _id: { $in: counterpartIds } })
  .select({ firstName: 1, lastName: 1, user_email: 1, authProvider: 1, msOid: 1, teamsEnabled: 1 })
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

  // ✅ Teams allowed if BOTH users are Microsoft + enabled
  teamsEligible: meTeams && isTeamsUser(u),
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
function requireGraphToken(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Missing Authorization Bearer token (Graph token)" });
    return null;
  }
  return token;
}

function isTeamsUser(u) {
  return !!u && u.authProvider === "microsoft" && !!u.msOid && u.teamsEnabled === true;
}

// Create a 1:1 Teams chat between two AAD users (by object id / msOid)
async function createOneOnOneChat(graphToken, meOid, otherOid) {
  const res = await fetch("https://graph.microsoft.com/v1.0/chats", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${graphToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chatType: "oneOnOne",
      members: [
        {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          roles: ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${meOid}')`,
        },
        {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          roles: ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${otherOid}')`,
        },
      ],
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// Find an existing 1:1 chat by scanning my chats (fallback when create fails)
async function findExistingOneOnOneChat(graphToken, otherOid) {
  // Grab a page of chats
  const listRes = await fetch("https://graph.microsoft.com/v1.0/me/chats?$top=50", {
    headers: { Authorization: `Bearer ${graphToken}` },
  });
  const listJson = await listRes.json().catch(() => ({}));
  const chats = Array.isArray(listJson.value) ? listJson.value : [];
  const oneOnOnes = chats.filter((c) => c.chatType === "oneOnOne");

  // For each oneOnOne chat, check members for otherOid
  for (const chat of oneOnOnes) {
    const membersRes = await fetch(
      `https://graph.microsoft.com/v1.0/chats/${chat.id}/members`,
      { headers: { Authorization: `Bearer ${graphToken}` } }
    );
    const membersJson = await membersRes.json().catch(() => ({}));
    const members = Array.isArray(membersJson.value) ? membersJson.value : [];

    const hasOther = members.some((m) => String(m.userId || "").toLowerCase() === String(otherOid).toLowerCase());
    if (hasOther) return chat.id;
  }

  return null;
}

async function sendChatMessage(graphToken, chatId, text) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${graphToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: { contentType: "text", content: text },
    }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

/**
 * POST /api/messages/send-teams
 * Body: { conversationId, text }
 * Headers:
 *  - x-user-id: current mongo user id
 *  - Authorization: Bearer <msGraphAccessToken>
 */
router.post("/send-teams", async (req, res) => {
  try {
    const meId = requireMe(req, res);
    if (!meId) return;

    const graphToken = requireGraphToken(req, res);
    if (!graphToken) return;

    const { conversationId, text } = req.body || {};
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ error: "Invalid conversationId" });
    }

    const cleanText = String(text || "").trim();
    if (!cleanText) return res.status(400).json({ error: "Message text required" });

    // Must be participant
    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    const isParticipant = (convo.participants || []).some((p) => String(p) === String(meId));
    if (!isParticipant) return res.status(403).json({ error: "Not allowed" });

    // Determine other user
    const otherId = (convo.participants || []).map(String).find((id) => id !== String(meId));
    if (!otherId) return res.status(400).json({ error: "Conversation missing other user" });

    // Enforce booking relationship (same rule as your contacts)
    const allowedIds = await getBookedCounterpartIds(meId);
    if (!allowedIds.includes(String(otherId))) {
      return res.status(403).json({ error: "You can only message users you have booked with." });
    }

    // Load users for Teams eligibility
    const me = await User.findById(meId).select({ authProvider: 1, msOid: 1, teamsEnabled: 1 }).lean();
    const other = await User.findById(otherId).select({ authProvider: 1, msOid: 1, teamsEnabled: 1 }).lean();

    if (!isTeamsUser(me) || !isTeamsUser(other)) {
      return res.status(400).json({ error: "Both users must be Teams-enabled Microsoft users." });
    }

    // Get/create Teams chat
    let chatId = convo.teamsChatId || "";

    if (!chatId) {
      const created = await createOneOnOneChat(graphToken, me.msOid, other.msOid);

      if (created.ok && created.json?.id) {
        chatId = created.json.id;
        convo.teamsChatId = chatId;
        await convo.save();
      } else {
        // Fallback: try to find an existing 1:1 chat
        const foundChatId = await findExistingOneOnOneChat(graphToken, other.msOid);
        if (!foundChatId) {
          return res.status(created.status || 500).json({
            error: "Could not create or find Teams chat",
            details: created.json,
          });
        }
        chatId = foundChatId;
        convo.teamsChatId = chatId;
        await convo.save();
      }
    }

    // Send Teams message
    const sent = await sendChatMessage(graphToken, chatId, cleanText);
    if (!sent.ok) {
      return res.status(sent.status || 500).json({
        error: "Teams send failed",
        details: sent.json,
      });
    }

    // Optional: also write to your local Message collection (so your UI shows history)
    const msg = await Message.create({
      conversationId,
      senderId: meId,
      text: cleanText,
      type: "teams",
    });

    convo.lastMessageText = cleanText;
    convo.lastMessageAt = new Date();
    await convo.save();

    return res.json({
      ok: true,
      chatId,
      graphMessageId: sent.json?.id || null,
      messageId: String(msg._id),
    });
  } catch (err) {
    console.error("POST /send-teams error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
