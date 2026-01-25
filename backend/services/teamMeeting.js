// backend/services/teamsMeetings.js
const { ConfidentialClientApplication } = require("@azure/msal-node");

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

async function createTeamsMeeting({ subject, startISO, endISO }) {
  const token = await getAppToken();
  const organizerUserId = process.env.TEAMS_ORGANIZER_USER_ID;

  if (!organizerUserId) throw new Error("Missing TEAMS_ORGANIZER_USER_ID in .env");

  const url = `https://graph.microsoft.com/v1.0/users/${organizerUserId}/onlineMeetings`;

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

  const json = await res.json();
  if (!res.ok) throw new Error(`Graph error ${res.status}: ${JSON.stringify(json)}`);

  return { meetingId: json.id, joinUrl: json.joinWebUrl };
}

module.exports = { createTeamsMeeting };
