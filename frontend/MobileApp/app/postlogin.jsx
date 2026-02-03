// /app/postlogin.jsx
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { router } from "expo-router";
import { getStoredUserId } from "../lib/auth";
import { GRAPHQL_URL } from "../lib/api";

const USER_BY_ID = `
  query UserById($id: ID!) {
    userById(id: $id) {
      _id
      accountType
    }
  }
`;

export default function PostLogin() {
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const userId = await getStoredUserId();
        if (!userId) {
          router.replace("/auth/login");
          return;
        }

        // optional: fetch user account type
        const resp = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: USER_BY_ID, variables: { id: userId } }),
        });

        const json = await resp.json();

        if (!resp.ok || json.errors?.length) {
          throw new Error(json.errors?.[0]?.message ?? "GraphQL error");
        }

        // done, go to Home
        router.replace("/home");
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      }
    })();

    return () => { alive = false; };
  }, []);

  if (err) return <View style={{ marginTop: 50, padding: 16 }}><Text>Error: {err}</Text></View>;
  return <ActivityIndicator style={{ marginTop: 50 }} />;
}
