import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000";
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export default function SubjectCourses() {
  const { subject } = useLocalSearchParams();
  const subjectName = decodeURIComponent(String(subject || ""));

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${API_URL}/api/courses?subject=${encodeURIComponent(subjectName)}`
        );

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
  }, [subjectName]);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (err) return <Text style={{ marginTop: 50, padding: 16 }}>Error: {err}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{subjectName}</Text>

      {courses.length === 0 ? (
        <Text style={{ color: "#666" }}>No courses found for this subject.</Text>
      ) : (
        courses.map((c) => (
          <View key={String(c._id)} style={styles.card}>
            <Text style={styles.courseName}>
              {(c.courseName ?? "Course")} {c.courseCode ? `(${c.courseCode})` : ""}
            </Text>
            {!!c.type && <Text style={styles.meta}>Type: {c.type}</Text>}
            {!!c.description && <Text style={styles.meta}>{c.description}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, marginBottom: 12 },
  courseName: { fontSize: 16, fontWeight: "900" },
  meta: { marginTop: 6, color: "#444" },
});
