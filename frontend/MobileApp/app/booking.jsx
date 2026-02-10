import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HOME_ROUTE = "/home"; // <-- change to "/(tabs)/home" if your home is under a group

function formatDateTimeRange(startISO, endISO) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const startTime = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endTime = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return { date, time: `${startTime} – ${endTime}` };
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams(); // /booking?id=...
  const courseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;

  const [course, setCourse] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const API_BASE = useMemo(() => {
    const API_WEB = "http://localhost:5000";
    const API_DEVICE = "http://192.168.86.22:5000";
    return Platform.OS === "web" ? API_WEB : API_DEVICE;
  }, []);

  async function getStudentId() {
    return Platform.OS === "web"
      ? localStorage.getItem("mongoUserId")
      : AsyncStorage.getItem("mongoUserId");
  }

  async function getAccountType() {
    const raw =
      Platform.OS === "web"
        ? localStorage.getItem("accountType")
        : await AsyncStorage.getItem("accountType");
    return (raw || "").trim().toLowerCase();
  }

  function goHomeNow() {
    // Most reliable “get me to home”
    try {
      router.dismissAll?.();
    } catch {}
    router.replace(HOME_ROUTE);
  }

  function goBack() {
    // You said you want back to go home from booking
    goHomeNow();
  }

  async function loadCourseAndSlots() {
    if (!courseId) {
      Alert.alert("Error", "No course selected.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const courseRes = await fetch(`${API_BASE}/api/courses/${courseId}`);
      if (!courseRes.ok) throw new Error("Failed to load course");
      const courseData = await courseRes.json();
      setCourse(courseData);

      const slotsRes = await fetch(
        `${API_BASE}/api/courses/${courseId}/available-slots?daysAhead=14`
      );
      if (!slotsRes.ok) throw new Error("Failed to load availability");
      const slotsData = await slotsRes.json();
      setAvailableSlots(slotsData.availableSlots || []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSlots() {
    if (!courseId) return;
    const slotsRes = await fetch(
      `${API_BASE}/api/courses/${courseId}/available-slots?daysAhead=14`
    );
    const slotsData = await slotsRes.json();
    setAvailableSlots(slotsData.availableSlots || []);
  }

  async function bookSession() {
    if (!selectedSlot || !course) return;

    const studentId = await getStudentId();
    if (!studentId) {
      Alert.alert("Login required", "You must be logged in to book.");
      return;
    }

    const accountType = await getAccountType();
    if (accountType !== "student") {
      Alert.alert("Student only", "You must be logged in as a student to book.");
      return;
    }

    setBooking(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          tutorId: course.educatorId,
          start: selectedSlot.start,
          end: selectedSlot.end,
        }),
      });

      if (res.status === 409) {
        Alert.alert("Slot taken", "That slot was just booked. Refreshing…");
        setSelectedSlot(null);
        await refreshSlots();
        return;
      }

      const text = await res.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        console.error("Booking failed status:", res.status);
        console.error("Booking failed response:", payload || text);
        Alert.alert("Booking failed", payload?.error || payload?.message || text || "Booking failed");
        return;
      }

      // ✅ Don’t rely on Alert button callbacks for navigation.
      // Navigate immediately.
      goHomeNow();

      // Optional: show message (fine if it doesn’t show due to navigation timing)
      Alert.alert("Success", "Session booked successfully!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to book session.");
    } finally {
      setBooking(false);
    }
  }

  useEffect(() => {
    loadCourseAndSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const slotsByDate = useMemo(() => {
    const groups = new Map();
    for (const s of availableSlots) {
      const { date } = formatDateTimeRange(s.start, s.end);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(s);
    }
    return Array.from(groups.entries());
  }, [availableSlots]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.siteTitle}>Noesis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.box}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}> Loading…</Text>
            </View>
          ) : !course ? (
            <Text style={styles.h2}>Course not found.</Text>
          ) : (
            <>
              <Text style={styles.h2}>{course.courseName}</Text>
              <Text style={styles.meta}>
                {course.subject} · {course.type === "tutoring" ? "Course Tutoring" : "Course Discussion"}
              </Text>

              {!!course.description && <Text style={styles.desc}>{course.description}</Text>}

              <Text style={styles.h3}>Available Sessions (60 min)</Text>

              {availableSlots.length === 0 ? (
                <Text style={styles.muted}>No open time slots right now.</Text>
              ) : (
                slotsByDate.map(([date, slots]) => (
                  <View key={date} style={{ marginBottom: 14 }}>
                    <Text style={styles.dateHeader}>{date}</Text>

                    {slots.map((slot, index) => {
                      const { time } = formatDateTimeRange(slot.start, slot.end);
                      const selected =
                        selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

                      return (
                        <Pressable
                          key={index}
                          onPress={() => setSelectedSlot(slot)}
                          style={[styles.slotCard, selected && styles.slotCardSelected]}
                        >
                          <Text style={styles.slotTime}>{time}</Text>
                          <Text style={styles.slotDetails}>
                            {slot.mode === "IRL"
                              ? `In Person${slot.location ? ` · ${slot.location}` : ""}`
                              : "Online"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              )}

              {selectedSlot && (
                <Pressable
                  onPress={bookSession}
                  disabled={booking}
                  style={[styles.bookBtn, booking && { opacity: 0.6 }]}
                >
                  <Text style={styles.bookBtnText}>{booking ? "Booking..." : "Book Session"}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
  },
  backText: { fontSize: 14 },
  siteTitle: { fontSize: 18, fontWeight: "800" },

  container: { padding: 16 },
  box: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },

  center: { flexDirection: "row", alignItems: "center" },
  muted: { color: "#666" },

  h2: { fontSize: 20, fontWeight: "900" },
  h3: { fontSize: 16, fontWeight: "900", marginTop: 14, marginBottom: 8 },

  meta: { marginTop: 6, color: "#374151" },
  desc: { marginTop: 10, color: "#111827" },

  dateHeader: { fontWeight: "900", marginBottom: 6, marginTop: 6 },

  slotCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  slotCardSelected: {
    borderColor: "#111827",
    backgroundColor: "#eaf2ff",
  },
  slotTime: { fontWeight: "900" },
  slotDetails: { marginTop: 4, color: "#374151" },

  bookBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontWeight: "900" },
});
