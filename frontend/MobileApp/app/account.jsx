// MobileApp/app/account.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const GRAPHQL_WEB = "http://localhost:5000/graphql";
const GRAPHQL_DEVICE = "http://192.168.4.28:5000/graphql";
const GRAPHQL_URL = Platform.OS === "web" ? GRAPHQL_WEB : GRAPHQL_DEVICE;

const USER_BY_ID = `
  query ($id: ID!) {
    userById(id: $id) {
      _id
      firstName
      middleName
      lastName
      user_email
      student {
        schoolName
        concentration
      }
    }
  }
`;

const BOOKINGS_BY_STUDENT = `
  query ($studentId: ID!) {
    bookingsByStudent(studentId: $studentId) {
      _id
      title
      start
      end
      iscompleted
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

const clean = (v) => {
  const s = v == null ? "" : String(v).trim();
  return s.length ? s : "";
};

export default function AccountScreen() {
  const [userId, setUserId] = useState(null);

  const [student, setStudent] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [err, setErr] = useState("");

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // 1) Load logged-in user id from storage (web + native)
  useEffect(() => {
    (async () => {
      const id =
        Platform.OS === "web"
          ? localStorage.getItem("mongoUserId")
          : await AsyncStorage.getItem("mongoUserId");

      setUserId(id || null);
    })();
  }, []);

  // 2) Load profile (userById)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userId) return;

      try {
        setLoadingProfile(true);
        setErr("");

        const data = await gqlFetch(USER_BY_ID, { id: userId });
        if (!alive) return;

        console.log("USER_BY_ID:", data?.userById); // <-- verify in console
        setStudent(data?.userById ?? null);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setLoadingProfile(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  // 3) Load bookings (bookingsByStudent)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!userId) return;

      try {
        setLoadingBookings(true);
        setErr("");

        const data = await gqlFetch(BOOKINGS_BY_STUDENT, { studentId: userId });
        if (!alive) return;

        const list = data?.bookingsByStudent ?? [];
        setBookings(list);

        const today = new Date().toISOString().slice(0, 10);
        setSelectedDay((d) => d ?? today);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setLoadingBookings(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  // Display strings
  const displayName = useMemo(() => {
    if (!student) return "";
    return [clean(student.firstName), clean(student.middleName), clean(student.lastName)]
      .filter(Boolean)
      .join(" ");
  }, [student]);

  const schoolName = useMemo(() => clean(student?.student?.schoolName), [student]);
  const concentration = useMemo(() => clean(student?.student?.concentration), [student]);

  // bookings grouped by day
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
    Object.keys(bookingsByDay).forEach((day) => {
      marks[day] = { marked: true };
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

  const logout = async () => {
    if (Platform.OS === "web") {
      localStorage.removeItem("mongoUserId");
      localStorage.removeItem("accountType");
    } else {
      await AsyncStorage.multiRemove(["mongoUserId", "accountType"]);
    }
    router.replace("/auth/login");
  };

  if (!userId) return <Text style={{ marginTop: 50, padding: 16 }}>Not logged in yet.</Text>;
  if (loadingBookings || loadingProfile) return <ActivityIndicator style={{ marginTop: 50 }} />;
  if (err) return <Text style={{ marginTop: 50, padding: 16 }}>Error: {err}</Text>;

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace("/home")} style={styles.topBtn}>
          <Text style={styles.topBtnText}>← Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Inov8r</Text>

        <Pressable onPress={logout} style={styles.topBtn}>
          <Text style={styles.topBtnText}>Log out</Text>
        </Pressable>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={styles.main}>
        <View style={styles.profileCard}>
          <Text style={styles.name}>{displayName || "Student"}</Text>

          {!!schoolName && <Text style={styles.subtext}>{schoolName}</Text>}
          {!!concentration && <Text style={styles.subtext}>{concentration}</Text>}

          <View style={styles.sessionsBox}>
            <Text style={styles.sectionTitle}>Scheduled Tutoring & Meetings</Text>

            <View style={styles.calendarWrap}>
              <Calendar
                markedDates={markedDates}
                onDayPress={(d) => setSelectedDay(d.dateString)}
              />
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
        </View>
      </ScrollView>

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
  topTitle: { fontSize: 18, fontWeight: "800" },
  topBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  topBtnText: { fontWeight: "700" },

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

  main: { padding: 16, paddingTop: 50 },

  profileCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },

  name: { fontSize: 22, fontWeight: "900" },
  subtext: { marginTop: 4, fontSize: 14, color: "#555", fontWeight: "600" },

  sessionsBox: { marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 10 },

  // smaller calendar
  calendarWrap: {
    alignSelf: "center",
    width: 320,
    transform: [{ scale: 0.9 }],
  },

  subtitle: { marginTop: 10, fontWeight: "800" },
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