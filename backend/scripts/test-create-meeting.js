// backend/scripts/test-create-meeting.js
require("dotenv").config();

const { fetchImpl, readBody, mustEnv, decodeJwtPayload } = require("./http");

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";

/**
 * App-only token (client credentials)
 */
async function getGraphToken() {
  const tenantId = mustEnv("AZURE_TENANT_ID");
  const clientId = mustEnv("AZURE_CLIENT_ID");
  const clientSecret = mustEnv("AZURE_CLIENT_SECRET");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const { text, json } = await readBody(res);
  if (!res.ok) throw new Error(`Token failed (${res.status}): ${text}`);
  return json.access_token;
}

/**
 * Creates an Outlook calendar event with an attached Teams meeting.
 * This is the method that makes it visible in Teams/Outlook for the organizer.
 *
 * POST /users/{id|upn}/events
 */
async function createTeamsMeetingEvent({ organizer, startLocal, endLocal, timeZone }) {
  const token = await getGraphToken();

  // Optional debug: confirm app roles
  const claims = decodeJwtPayload(token);
  console.log("TOKEN roles:", claims?.roles || "(none)");
  console.log("TOKEN scp:", claims?.scp || "(none)");

  const url = `${GRAPH_ROOT}/users/${encodeURIComponent(organizer)}/events`;

  const eventPayload = {
    subject: "Noesis Tutoring Session",
    body: {
      contentType: "HTML",
      content: "Tutoring session created from the Noesis web app.",
    },
    start: {
      // IMPORTANT: when you provide timeZone, use local time (no offset)
      dateTime: startLocal,
      timeZone,
    },
    end: {
      dateTime: endLocal,
      timeZone,
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  const { text, json } = await readBody(res);

  console.log("STATUS:", res.status);
  console.log("BODY:", text);

  if (!res.ok) throw new Error(`Graph failed (${res.status}): ${text}`);

  const joinUrl = json?.onlineMeeting?.joinUrl || json?.onlineMeeting?.joinWebUrl || null;

  console.log("✅ Event created:", json?.id);
  console.log("✅ Join URL:", joinUrl || "(No join URL returned)");

  return { id: json?.id, joinUrl };
}

/**
 * Jan 25 @ 1pm Puerto Rico time.
 * Puerto Rico is "America/Puerto_Rico".
 *
 * Use local time strings (NO offset) since we're passing timeZone separately.
 */
function buildPRTimesJan25_1pm() {
  return {
    startLocal: "2026-02-5T13:00:00",
    endLocal: "2026-02-5T16:00:00",
    timeZone: "America/Puerto_Rico",
  };
}

async function main() {
  // Put either the organizer UPN/email OR the user GUID here.
  // UPN is usually easiest:
  // TEAMS_ORGANIZER=jsewell@databasepr.com
  const organizer = mustEnv("TEAMS_ORGANIZER");

  const { startLocal, endLocal, timeZone } = buildPRTimesJan25_1pm();

  await createTeamsMeetingEvent({
    organizer,
    startLocal,
    endLocal,
    timeZone,
  });
}

main().catch((err) => {
  console.error("❌ ERROR:", err.message || err);
  process.exit(1);
});
