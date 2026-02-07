import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { GRAPHQL_URL } from "../../lib/api";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000";
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export default function BrowseClasses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_URL}/api/courses`);
        const text = await res.text();

        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(text || "Non-JSON response from /api/courses");
        }

        if (!res.ok) throw new Error(json?.message || "Failed to load courses");
        if (!alive) return;

        setCourses(Array.isArray(json) ? json : []);
      } catch (e) {
        if (alive) setErr(String(e?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Unique subjects
  const subjects = useMemo(() => {
    const set = new Set();
    for (const c of courses) {
      const s = (c?.subject ?? "").toString().trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (err) return <Text style={{ marginTop: 50, padding: 16 }}>Error: {err}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Class Selection</Text>

      {subjects.length === 0 ? (
        <Text style={styles.empty}>No courses found yet.</Text>
      ) : (
        subjects.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={styles.button}
            onPress={() => router.push(`/classes/${encodeURIComponent(subject)}`)}
          >
            <Text style={styles.buttonText}>{subject}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, textAlign: "center", marginBottom: 30, fontWeight: "600" },
  empty: { textAlign: "center", color: "#666" },
  button: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 15,
    marginBottom: 15,
    alignItems: "center",
    borderRadius: 6,
  },
  buttonText: { fontSize: 18, fontWeight: "500" },
});
