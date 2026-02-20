// app/postlogin.jsx
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GRAPHQL_WEB = "http://localhost:5000/graphql";
const GRAPHQL_DEVICE = "http://192.168.4.28:5000/graphql";
const GRAPHQL_URL = Platform.OS === "web" ? GRAPHQL_WEB : GRAPHQL_DEVICE;

const USER_BY_ID = `
  query UserById($id: ID!) {
    userById(id: $id) {
      _id
      accountType
    }
  }
`;

async function getStoredUserId() {
  if (Platform.OS === "web") return localStorage.getItem("mongoUserId");
  return AsyncStorage.getItem("mongoUserId");
}

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

        const resp = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: USER_BY_ID, variables: { id: userId } }),
        });

        const raw = await resp.text();
        let json;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(raw || "Non-JSON response from GraphQL");
        }

        if (!resp.ok) {
          throw new Error(json?.message || `HTTP ${resp.status}`);
        }

        if (json?.errors?.length) {
          throw new Error(json.errors[0]?.message || "GraphQL error");
        }

        const accountTypeRaw = json?.data?.userById?.accountType ?? "";
        const accountType = String(accountTypeRaw).toLowerCase();

        if (!alive) return;

        if (accountType === "educator") {
          router.replace("/educatoraccount");
        } else {
          router.replace("/account"); // default student
        }
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <View style={{ marginTop: 50, padding: 16 }}>
        <Text>Error: {err}</Text>
      </View>
    );
  }

  return <ActivityIndicator style={{ marginTop: 50 }} />;
}