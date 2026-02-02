// backend/services/teamsMeetings.js
const { ConfidentialClientApplication } = require("@azure/msal-node");

// If your Node is < 18, uncomment these two lines:
// const fetch = require("node-fetch");

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";

const msal = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
});

async function getAppToken() {
  const result = await msal.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) throw new Error("Failed to get Graph access token");
  return result.accessToken;
}

/**
 * ✅ Calendar event w/ Teams meeting (shows in Outlook/Teams calendar)
 * POST /users/{id|upn}/events
 *
 * startLocal/endLocal: "YYYY-MM-DDTHH:mm:ss" (NO offset)
 * timeZone: e.g. "America/Puerto_Rico"
 *
 * Optional: pass attendees if you want both people to see it on their calendars.
 */
async function createTeamsMeetingEvent({
  organizer,
  startLocal,
  endLocal,
  timeZone,
  subject = "Noesis Tutoring Session",
  attendees = [],
}) {
  if (!organizer) throw new Error("Missing organizer (UPN or AAD user id)");
  if (!timeZone) throw new Error("Missing timeZone");

  const token = await getAppToken();
  const url = `${GRAPH_ROOT}/users/${encodeURIComponent(organizer)}/events`;

  const eventPayload = {
    subject,
    body: {
      contentType: "HTML",
      content: "Tutoring session created from the Noesis web app.",
    },
    start: { dateTime: startLocal, timeZone },
    end: { dateTime: endLocal, timeZone },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  // Add attendees if provided (makes it appear for them too)
  if (Array.isArray(attendees) && attendees.length > 0) {
    eventPayload.attendees = attendees.map((email) => ({
      emailAddress: { address: email },
      type: "required",
    }));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) {
    throw new Error(`Graph failed (${res.status}): ${text}`);
  }

  const joinUrl =
    json?.onlineMeeting?.joinUrl ||
    json?.onlineMeeting?.joinWebUrl ||
    null;

  return { eventId: json?.id || null, joinUrl };
}

/**
 * (Optional) Your old method (onlineMeetings) kept for compatibility.
 * This does NOT always show on calendar.
 */
async function createTeamsMeeting({ subject, startISO, endISO }) {
  const token = await getAppToken();
  const organizerUserId = process.env.TEAMS_ORGANIZER_USER_ID;

  if (!organizerUserId) throw new Error("Missing TEAMS_ORGANIZER_USER_ID in .env");

  const url = `${GRAPH_ROOT}/users/${organizerUserId}/onlineMeetings`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: subject || "Noesis Tutoring Session",
      startDateTime: startISO,
      endDateTime: endISO,
    }),
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) throw new Error(`Graph error ${res.status}: ${text}`);

  return { meetingId: json?.id || null, joinUrl: json?.joinWebUrl || null };
}

module.exports = { createTeamsMeetingEvent, createTeamsMeeting };
