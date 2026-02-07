// src/auth/verifyMicrosoftJwt.js
const { createRemoteJWKSet, jwtVerify } = require("jose");

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;

const JWKS = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`)
);

async function verifyMicrosoftJwt(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
    audience: CLIENT_ID,
  });

  return payload;
}

module.exports = { verifyMicrosoftJwt };
