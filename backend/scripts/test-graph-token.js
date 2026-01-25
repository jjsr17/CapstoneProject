require("dotenv").config();

async function main() {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;

  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("❌ Token failed:", json);
    process.exit(1);
  }

  console.log("✅ Token OK. Expires in:", json.expires_in, "seconds");
  console.log("Access token (first 30 chars):", (json.access_token || "").slice(0, 30));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
