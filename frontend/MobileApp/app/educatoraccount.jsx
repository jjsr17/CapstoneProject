import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_WEB = "http://localhost:5000/graphql";
const API_DEVICE = "http://192.168.86.240:5000/graphql";
const GRAPHQL_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

const SESSIONS_BY_TUTOR = `
  query SessionsByTutor($tutorId: ID!) {
    sessionsByTutor(tutorId: $tutorId) {
      _id
      title
      start
      end
    }
  }
`;

async function gqlFetch(query, variables) {
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

  if (json?.errors?.length) throw new Error(json.errors[0]?.message || "GraphQL error");
  return json?.data;
}

export default function EducatorAccountScreen() {
  const [tutorId, setTutorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("mongoUserId");
      setTutorId(id);
    })();
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!tutorId) return;

      try {
        setLoading(true);
        setErr("");

        const data = await gqlFetch(SESSIONS_BY_TUTOR, { tutorId });
        if (!alive) return;

        setSessions(data?.sessionsByTutor ?? []);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tutorId]);

  const markedDates = useMemo(() => {
    const marks = {};
    sessions.forEach((s) => {
      const day = new Date(s.start).toISOString().slice(0, 10);
      marks[day] = { marked: true };
    });
    return marks;
  }, [sessions]);

  if (!tutorId) return <Text style={{ marginTop: 50, padding: 16 }}>Not logged in yet.</Text>;
  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (err) return <Text style={{ marginTop: 50, padding: 16 }}>Error: {err}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Educator Account</Text>
      <Calendar markedDates={markedDates} />
      <Text style={styles.subtitle}>Sessions: {sessions.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  subtitle: { marginTop: 10, color: "#666" },
});
