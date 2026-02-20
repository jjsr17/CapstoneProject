// backend/services/msMail.js
const { ConfidentialClientApplication } = require("@azure/msal-node");

const fetchImpl = global.fetch || require("node-fetch");
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
 * Send an email from a Microsoft mailbox (the organizer) to someone (tutor).
 * Requires app permission: Mail.Send (Application) and admin consent.
 */
async function sendTutorBookingEmail({
  fromUpn,        // the mailbox we send from (use organizer)
  toEmail,        // tutor email
  subject,
  html,
}) {
  const token = await getAppToken();
  const url = `${GRAPH_ROOT}/users/${encodeURIComponent(fromUpn)}/sendMail`;

  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: toEmail } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`sendMail failed (${res.status}): ${text}`);
  }
}

module.exports = { sendTutorBookingEmail };