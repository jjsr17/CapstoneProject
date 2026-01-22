// frontend/src/lib/graphql.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const GRAPHQL_URL = `${API_BASE}/graphql`;

export async function gqlFetch(query, variables = {}) {
  const resp = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await resp.text();

  let json;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(raw || "Non-JSON response from GraphQL");
  }

  if (!resp.ok) throw new Error(json?.message || raw || `HTTP ${resp.status}`);
  if (json?.errors?.length) throw new Error(json.errors[0]?.message || "GraphQL error");

  return json.data;
}
