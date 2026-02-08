// backend/routes/whiteBoard.js
const express = require("express");
const router = express.Router();

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
const WHITEBOARD_TEAMS_APP_ID = "95de633a-083e-42f5-b444-a4295d8e9314";

router.post("/start", async (req, res) => {
  try {
    const graphToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
    if (!graphToken) return res.status(401).json({ error: "Missing Graph token" });

    const { chatId, displayName } = req.body || {};
    if (!chatId) return res.status(400).json({ error: "Missing chatId" });

    // Deduplicate without DB: see if a Whiteboard tab already exists
    const existing = await findExistingWhiteboardTab(chatId, graphToken);
    if (existing) {
      return res.json({
        ok: true,
        reused: true,
        tab: {
          id: existing.id,
          displayName: existing.displayName,
          websiteUrl: existing.configuration?.websiteUrl,
          contentUrl: existing.configuration?.contentUrl,
        },
      });
    }

    // Create a new Whiteboard tab (lets Teams/Whiteboard provision a board)
    const tabBody = {
      displayName: displayName || "Whiteboard",
      "teamsApp@odata.bind": `${GRAPH_ROOT}/appCatalogs/teamsApps/${WHITEBOARD_TEAMS_APP_ID}`,
    };

    const resp = await fetch(`${GRAPH_ROOT}/chats/${encodeURIComponent(chatId)}/tabs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tabBody),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.error?.message || "Failed to create Whiteboard tab",
        details: data,
      });
    }

    return res.json({
      ok: true,
      reused: false,
      tab: {
        id: data.id,
        displayName: data.displayName,
        websiteUrl: data.configuration?.websiteUrl,
        contentUrl: data.configuration?.contentUrl,
      },
    });
  } catch (e) {
    console.error("Whiteboard start error:", e);
    return res.status(500).json({ error: "Server error creating Whiteboard tab" });
  }
});

async function findExistingWhiteboardTab(chatId, graphToken) {
  const resp = await fetch(
    `${GRAPH_ROOT}/chats/${encodeURIComponent(chatId)}/tabs?$expand=teamsApp`,
    { headers: { Authorization: `Bearer ${graphToken}` } }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return null;

  const tabs = Array.isArray(data.value) ? data.value : [];
  return tabs.find((t) => t?.teamsApp?.id === WHITEBOARD_TEAMS_APP_ID) || null;
}

module.exports = router;
