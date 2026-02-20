import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState(""); // "", "tutoring", "discussion"
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ MUST be reachable from device (and web)
  const API_BASE = useMemo(() => {
    const API_WEB = "http://localhost:5000";
    const API_DEVICE = "http://192.168.4.28:5000";
    return Platform.OS === "web" ? API_WEB : API_DEVICE;
  }, []);

  function goBack() {
    router.back();
  }

  function book(id) {
    // expo-router query param style
    router.push({ pathname: "/booking", params: { id } });
  }

  function formatSlot(slot) {
  const days = Array.isArray(slot.days) ? slot.days.join(", ") : "";

  // ✅ support BOTH old + new field names
  const startTime = slot.startTime ?? slot.start ?? "";
  const endTime = slot.endTime ?? slot.end ?? "";
  const startAmPm = (slot.startAmPm ?? slot.startAMPM ?? "").trim();
  const endAmPm = (slot.endAmPm ?? slot.endAMPM ?? "").trim();

  // If times are 24-hour (e.g. "18:00"), AM/PM is optional.
  const time = `${startTime}${startAmPm ? ` ${startAmPm}` : ""} – ${endTime}${
    endAmPm ? ` ${endAmPm}` : ""
  }`;

  const mode =
    slot.mode === "IRL"
      ? `In Person${slot.location ? ` · ${slot.location}` : ""}`
      : "Online";

  return `${days} · ${time} · ${mode}`;
}

  async function fetchSubjectCourses(subject) {
    try {
      setLoading(true);
      const q = encodeURIComponent(subject);
      const t = type ? `&type=${encodeURIComponent(type)}` : "";
      const res = await fetch(`${API_BASE}/api/courses?subject=${q}${t}`);
      if (!res.ok) throw new Error("Failed to fetch subject courses");
      setCourses(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function searchCourses(value, newType = type) {
    try {
      setLoading(true);
      const q = encodeURIComponent(value || "");
      const t = newType ? `&type=${encodeURIComponent(newType)}` : "";
      const res = await fetch(`${API_BASE}/api/courses?query=${q}${t}`);
      if (!res.ok) throw new Error("Failed to search courses");
      setCourses(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const SUBJECTS = [
    { key: "Math", title: "Mathematics", subtitle: "Algebra, Calculus, Geometry" },
    { key: "Science", title: "Science", subtitle: "Biology, Chemistry, Physics" },
    { key: "History", title: "History", subtitle: "World & U.S. History" },
    { key: "English", title: "English", subtitle: "Writing, Literature, Grammar" },
    { key: "Computer Science", title: "Computer Science", subtitle: "Programming, Algorithms" },
    { key: "Electrical", title: "Electrical", subtitle: "Circuits, Power, Electronics" },
    { key: "Spanish", title: "Spanish", subtitle: "Writing, Literature, Grammar" },
    { key: "Architecture", title: "Architecture", subtitle: "Design, History" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Noesis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page}>
        {/* Search input */}
        <View style={styles.searchCard}>
          <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              searchCourses(text);
            }}
            placeholder="Search subjects (Math, Science, History...)"
            style={styles.input}
          />

          {/* Type selector row (replaces <select>) */}
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => {
                setType("");
                searchCourses(query, "");
              }}
              style={[styles.typeChip, type === "" && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, type === "" && styles.typeChipTextActive]}>
                All Offerings
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setType("tutoring");
                searchCourses(query, "tutoring");
              }}
              style={[styles.typeChip, type === "tutoring" && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, type === "tutoring" && styles.typeChipTextActive]}>
                Tutoring
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setType("discussion");
                searchCourses(query, "discussion");
              }}
              style={[styles.typeChip, type === "discussion" && styles.typeChipActive]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  type === "discussion" && styles.typeChipTextActive,
                ]}
              >
                Discussion
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Subject grid */}
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.subjectGrid}>
          {SUBJECTS.map((s) => (
            <Pressable
              key={s.key}
              style={styles.subjectCard}
              onPress={() => fetchSubjectCourses(s.key)}
            >
              <Text style={styles.subjectTitle}>{s.title}</Text>
              <Text style={styles.subjectSubtitle}>{s.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Results</Text>
          {loading ? <ActivityIndicator /> : null}
        </View>

        {!loading && courses.length === 0 ? (
          <Text style={styles.muted}>No course offerings found.</Text>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(c) => String(c._id)}
            scrollEnabled={false} // because we are inside ScrollView
            renderItem={({ item: c }) => (
              <View style={styles.resultCard}>
                <Text style={styles.courseName}>{c.courseName}</Text>
                <Text style={styles.courseMeta}>
                  <Text style={{ fontWeight: "700" }}>{c.subject}</Text> · {c.type}
                </Text>

                {!!c.description && <Text style={styles.courseDesc}>{c.description}</Text>}

                {Array.isArray(c.availability) && c.availability.length > 0 ? (
                  <View style={styles.availabilityBox}>
                    <Text style={styles.avTitle}>Available:</Text>
                    {c.availability.map((slot, idx) => (
                      <Text key={idx} style={styles.avLine}>
                        • {formatSlot(slot)}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.muted}>No availability posted.</Text>
                )}

                <Pressable style={styles.bookBtn} onPress={() => book(c._id)}>
                  <Text style={styles.bookBtnText}>Book</Text>
                </Pressable>
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#f4f4f4" },
  backText: { fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: "800" },

  page: { padding: 16 },

  searchCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fafafa",
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  typeChipActive: { backgroundColor: "#111827" },
  typeChipText: { fontSize: 12 },
  typeChipTextActive: { color: "#fff" },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 8, marginBottom: 10 },

  subjectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  subjectCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
  },
  subjectTitle: { fontSize: 14, fontWeight: "800" },
  subjectSubtitle: { marginTop: 6, fontSize: 12, color: "#666" },

  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  muted: { color: "#666" },

  resultCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  courseName: { fontSize: 16, fontWeight: "800" },
  courseMeta: { marginTop: 4, color: "#374151" },
  courseDesc: { marginTop: 8, color: "#111827" },

  availabilityBox: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: "#f9fafb" },
  avTitle: { fontWeight: "800", marginBottom: 6 },
  avLine: { color: "#374151", marginBottom: 2 },

  bookBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignSelf: "flex-start",
  },
  bookBtnText: { color: "#fff", fontWeight: "800" },
});
