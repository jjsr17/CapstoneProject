// MobileApp/app/educatoraccount.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000";
const API_BASE = Platform.OS === "web" ? API_WEB : API_DEVICE;
const GRAPHQL_URL = `${API_BASE}/graphql`;

const USER_AND_TUTOR_PROFILE = `
  query ($id: ID!) {
    userById(id: $id) {
      _id
      firstName
      lastName
      educator {
        collegeName
        degree
        concentration
      }
    }
    tutorProfileByUserId(userId: $id) {
      tutor_rate
      tutor_rating
      subjects
    }
  }
`;

const BOOKINGS_BY_TUTOR = `
  query BookingsByTutor($tutorId: ID!) {
    bookingsByTutor(tutorId: $tutorId) {
      _id
      title
      start
      end
      iscompleted
    }
  }
`;

async function getStoredUserId() {
  if (Platform.OS === "web") return localStorage.getItem("mongoUserId");
  return AsyncStorage.getItem("mongoUserId");
}

async function clearStoredAuth() {
  if (Platform.OS === "web") {
    localStorage.removeItem("mongoUserId");
    localStorage.removeItem("accountType");
  } else {
    await AsyncStorage.multiRemove(["mongoUserId", "accountType"]);
  }
}

async function safeJson(resp) {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text || "Non-JSON response" };
  }
}

async function gqlFetch(query, variables) {
  const resp = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await safeJson(resp);

  if (!resp.ok) {
    throw new Error(json?.message || `GraphQL HTTP ${resp.status}`);
  }
  if (json?.errors?.length) {
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json?.data;
}

function clean(v) {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : null;
}

export default function EducatorAccountScreen() {
  const [userId, setUserId] = useState(null);

  const [educator, setEducator] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [err, setErr] = useState("");

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // ---- load userId once
  useEffect(() => {
    (async () => {
      const id = await getStoredUserId();
      setUserId(id);
    })();
  }, []);

  // ---- load educator profile + tutor profile (GraphQL)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userId) return;
      try {
        setProfileLoading(true);
        setErr("");

        const data = await gqlFetch(USER_AND_TUTOR_PROFILE, { id: userId });
        if (!alive) return;

        setEducator(data?.userById ?? null);
        setTutorProfile(data?.tutorProfileByUserId ?? null);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  // ---- load bookings (GraphQL)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userId) return;
      try {
        setBookingsLoading(true);
        setErr("");

        const data = await gqlFetch(BOOKINGS_BY_TUTOR, { tutorId: userId });
        if (!alive) return;

        const list = data?.bookingsByTutor ?? [];
        setBookings(list);

        // pick today by default
        const today = new Date().toISOString().slice(0, 10);
        setSelectedDay((d) => d ?? today);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setBookingsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  // ---- load courses (REST)
  const loadCourses = useCallback(async () => {
    if (!userId) return;
    try {
      setCoursesLoading(true);
      setErr("");

      const resp = await fetch(`${API_BASE}/api/courses?educatorId=${encodeURIComponent(userId)}`);
      const json = await safeJson(resp);

      if (!resp.ok) {
        throw new Error(json?.message || `Courses HTTP ${resp.status}`);
      }

      setCourses(Array.isArray(json) ? json : []);
    } catch (e) {
      setErr(String(e?.message ?? e));
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const deleteCourse = useCallback(
    async (courseId) => {
      Alert.alert("Delete course?", "Are you sure you want to delete this offering?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const resp = await fetch(`${API_BASE}/api/courses/${courseId}`, { method: "DELETE" });
              const json = await safeJson(resp);
              if (!resp.ok) throw new Error(json?.message || "Delete failed");
              await loadCourses();
            } catch (e) {
              Alert.alert("Error", String(e?.message ?? e));
            }
          },
        },
      ]);
    },
    [loadCourses]
  );

  // ---- computed UI strings
  const displayName = useMemo(() => {
    if (!educator) return "Educator";
    return [clean(educator.firstName), clean(educator.lastName)].filter(Boolean).join(" ");
  }, [educator]);

  const degree = clean(educator?.educator?.degree) || "Degree";
  const concentration = clean(educator?.educator?.concentration) || "Concentration";

  const ratingText =
    tutorProfile?.tutor_rating != null ? `${tutorProfile.tutor_rating} ⭐` : "No rating yet";
  const rateText = tutorProfile?.tutor_rate ? ` · Rate: ${tutorProfile.tutor_rate}` : "";

  // ---- bookings grouped by day
  const bookingsByDay = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const day = new Date(b.start).toISOString().slice(0, 10);
      if (!map[day]) map[day] = [];
      map[day].push(b);
    }
    return map;
  }, [bookings]);

  const markedDates = useMemo(() => {
    const marks = {};
    Object.keys(bookingsByDay).forEach((d) => {
      marks[d] = { marked: true };
    });

    if (selectedDay) {
      marks[selectedDay] = {
        ...(marks[selectedDay] ?? {}),
        selected: true,
        selectedColor: "#111",
      };
    }
    return marks;
  }, [bookingsByDay, selectedDay]);

  const dayBookings = selectedDay ? bookingsByDay[selectedDay] ?? [] : [];

  const logout = useCallback(async () => {
    await clearStoredAuth();
    router.replace("/auth/login");
  }, []);

  if (!userId) return <Text style={{ marginTop: 50, padding: 16 }}>Not logged in yet.</Text>;
  if (err) return <Text style={{ marginTop: 50, padding: 16 }}>Error: {err}</Text>;

  const loadingAny = profileLoading || bookingsLoading || coursesLoading;
  if (loadingAny) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace("/home")} style={styles.topBtn}>
          <Text style={styles.topBtnText}>← Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Noesis</Text>

        <Pressable onPress={logout} style={styles.topBtn}>
          <Text style={styles.topBtnText}>Log out</Text>
        </Pressable>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={styles.main}>
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.subtext}>
            {degree} · {concentration}
          </Text>
          <Text style={styles.subtext}>
            {ratingText}
            {rateText}
          </Text>

          <View style={styles.box}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bodyText}>
              Brief description of the educator, teaching philosophy, experience, and areas of
              expertise.
            </Text>
          </View>

          {/* Calendar */}
          <View style={styles.box}>
            <Text style={styles.sectionTitle}>Scheduled Tutoring & Meetings</Text>

            <View style={styles.calendarWrap}>
              <Calendar markedDates={markedDates} onDayPress={(d) => setSelectedDay(d.dateString)} />
            </View>

            <Text style={styles.subtitle}>
              {selectedDay ? `Bookings on ${selectedDay}` : "Tap a date"}
            </Text>

            {dayBookings.length === 0 ? (
              <Text style={styles.empty}>No bookings on this day.</Text>
            ) : (
              dayBookings.map((b) => (
                <Pressable
                  key={b._id}
                  style={styles.bookingRow}
                  onPress={() => setSelectedBooking(b)}
                >
                  <Text style={styles.bookingTitle}>{b.title}</Text>
                  <Text style={styles.bookingMeta}>
                    {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}
                  </Text>
                  <Text style={styles.bookingMeta}>
                    Completed: {b.iscompleted ? "Yes" : "No"}
                  </Text>
                </Pressable>
              ))
            )}

            <Text style={styles.count}>Sessions loaded: {bookings.length}</Text>
          </View>

          {/* Course Offerings */}
          <View style={styles.box}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Course Offerings</Text>

              <Pressable
                onPress={() => router.push("/courseoffering")}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>+</Text>
              </Pressable>
            </View>

            {courses.length === 0 ? (
              <Text style={styles.empty}>No courses added yet.</Text>
            ) : (
              courses.map((c) => (
                <View key={c._id} style={styles.courseCard}>
                  <Text style={styles.courseTitle}>
                    {c.courseName} {c.courseCode ? `(${c.courseCode})` : ""}
                  </Text>
                  <Text style={styles.courseMeta}>Subject: {c.subject}</Text>
                  <Text style={styles.courseMeta}>Type: {c.type}</Text>
                  {!!c.description && <Text style={styles.courseDesc}>{c.description}</Text>}

                  <Pressable
                    onPress={() => deleteCourse(c._id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Followers section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Followers</Text>
          <View style={styles.followPlaceholder} />
          <Text style={styles.empty}>No followers yet.</Text>
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={!!selectedBooking} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBooking(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Title:</Text> {selectedBooking?.title}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Start:</Text>{" "}
              {selectedBooking ? new Date(selectedBooking.start).toLocaleString() : ""}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>End:</Text>{" "}
              {selectedBooking ? new Date(selectedBooking.end).toLocaleString() : ""}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.bold}>Completed:</Text>{" "}
              {selectedBooking?.iscompleted ? "Yes" : "No"}
            </Text>

            <Pressable style={styles.closeBtn} onPress={() => setSelectedBooking(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  topTitle: { fontSize: 18, fontWeight: "900" },
  topBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  topBtnText: { fontWeight: "800" },

  banner: {
    height: 110,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ddd",
    marginBottom: -36,
    borderWidth: 3,
    borderColor: "#fff",
  },

  main: { padding: 16, paddingTop: 50, gap: 16 },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },

  name: { fontSize: 22, fontWeight: "900" },
  subtext: { marginTop: 4, fontSize: 14, color: "#555", fontWeight: "600" },

  box: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 10 },
  bodyText: { color: "#444" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Smaller calendar
  calendarWrap: {
    alignSelf: "center",
    width: 320,
    transform: [{ scale: 0.9 }],
  },

  subtitle: { marginTop: 10, fontWeight: "900" },
  empty: { marginTop: 8, color: "#666" },

  bookingRow: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  bookingTitle: { fontWeight: "900" },
  bookingMeta: { marginTop: 4, color: "#444" },
  count: { marginTop: 10, color: "#666" },

  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 18, marginTop: -1 },

  courseCard: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  courseTitle: { fontWeight: "900", fontSize: 15 },
  courseMeta: { marginTop: 4, color: "#444" },
  courseDesc: { marginTop: 8, color: "#333" },

  deleteBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#111",
  },
  deleteBtnText: { fontWeight: "900" },

  followPlaceholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    marginTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10 },
  modalText: { marginTop: 6, color: "#333" },
  bold: { fontWeight: "900" },

  closeBtn: {
    marginTop: 14,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontWeight: "900" },
});
