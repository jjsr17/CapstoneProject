require("dotenv").config();

async function getGraphToken() {
  const tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.access_token;
}

async function main() {
  const token = await getGraphToken();
  const id = process.env.TEAMS_ORGANIZER_USER_ID;

  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${id}?$select=id,displayName,userPrincipalName`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("BODY:", text);
}

main().catch(console.error);
