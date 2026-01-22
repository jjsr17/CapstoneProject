import { Platform } from "react-native";

const API_WEB = "http://localhost:5000/graphql";
const API_DEVICE = "http://192.168.86.240:5000/graphql"; // your LAN IP
export const GRAPHQL_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export async function gqlFetch(query, variables) {
  const resp = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await resp.text();

  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(raw || "Non-JSON response from GraphQL");
  }

  if (!resp.ok) throw new Error(json?.message || raw || `HTTP ${resp.status}`);
  if (json?.errors?.length) throw new Error(json.errors[0]?.message || "GraphQL error");

  return json.data;
}
