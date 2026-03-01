// MobileApp/app/courseoffering.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.4.28:5000";
const API_BASE = Platform.OS === "web" ? API_WEB : API_DEVICE;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AMPM = ["AM", "PM"];
const MODES = ["Online", "IRL"];


async function getMsAccessToken() {
  if (Platform.OS === "web") return localStorage.getItem("msAccessToken");
  return AsyncStorage.getItem("msAccessToken");
}
function autoFormatTimeInput(value) {
  const raw = String(value ?? "");

  // If the user typed a colon, respect it and just sanitize parts
  if (raw.includes(":")) {
    const [hRaw, mRaw = ""] = raw.split(":");
    const h = hRaw.replace(/\D/g, "").slice(0, 2);
    const m = mRaw.replace(/\D/g, "").slice(0, 2);
    return `${h}:${m}`;
  }

  // Digits-only typing: auto-insert colon when minutes begin
  const digits = raw.replace(/\D/g, "").slice(0, 4); // max HHMM
  if (!digits) return "";

  if (digits.length <= 2) {
    // still typing hour
    return digits;
  }

  if (digits.length === 3) {
    // HMM -> H:MM
    return `${digits[0]}:${digits.slice(1)}`;
  }

  // HHMM -> HH:MM
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
function normalizeTimeOnBlur(value) {
  const v = String(value ?? "").trim();

  // "9:3" -> "9:03"
  let m = v.match(/^(\d{1,2}):(\d)$/);
  if (m) return `${m[1]}:0${m[2]}`;

  // "9:" -> keep as-is (validation will catch)
  return v;
}
function to24HourMobile(hhmm, ampm) {
  const v = String(hhmm ?? "").trim();

  // Require H:MM or HH:MM, hour 1-12, minutes 00-59
  const m = v.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);

  if (h < 1 || h > 12) return null;

  const ap = String(ampm || "").toUpperCase();
  if (ap === "AM") {
    if (h === 12) h = 0;
  } else if (ap === "PM") {
    if (h !== 12) h += 12;
  } else {
    return null;
  }

  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// Allow only digits + ":" while typing/pasting
function sanitizeTimeInput(value) {
  let v = String(value || "").replace(/[^0-9:]/g, "");

  // allow only ONE colon
  const firstColon = v.indexOf(":");
  if (firstColon !== -1) {
    v = v.slice(0, firstColon + 1) + v.slice(firstColon + 1).replace(/:/g, "");
  }

  // limit length to "HH:MM" max 5 chars
  if (v.length > 5) v = v.slice(0, 5);

  return v;
}

// Final validation: 12-hour times with minutes (1-12):(00-59)
function isValidHHMM12(value) {
  const v = String(value || "").trim();
  const m = v.match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return false;
  const h = parseInt(m[1], 10);
  return h >= 1 && h <= 12;
}
const emptyAvailability = () => ({
  days: [],
  start: "",
  startAMPM: "AM",
  end: "",
  endAMPM: "AM",
  mode: "Online",
  location: "",
});


const trimStr = (v) => (typeof v === "string" ? v.trim() : "");

async function getStoredUserId() {
  if (Platform.OS === "web") return localStorage.getItem("mongoUserId");
  return AsyncStorage.getItem("mongoUserId");
}

async function safeJson(resp) {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text || "Non-JSON response" };
  }
}

export default function CourseOfferingScreen() {
  // ===== Subjects =====
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");

  const [subject, setSubject] = useState("");
  const [otherCategory, setOtherCategory] = useState("");

  // ===== Offering fields =====
  const [type, setType] = useState(""); // tutoring | discussion
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");

  const [availability, setAvailability] = useState([emptyAvailability()]);
  const [submitting, setSubmitting] = useState(false);

  // ===== Load subjects once =====
  useEffect(() => {
    let alive = true;

    (async () => {
      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const res = await fetch(`${API_BASE}/api/subjects`);
        const data = await safeJson(res);

        if (!alive) return;

        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        const list = Array.isArray(data) ? data : [];
        setSubjects(list);

        // Default selection (first subject)
        setSubject((prev) => prev || list[0]?.subject_name || "");
      } catch (e) {
        if (!alive) return;
        console.error("❌ load subjects:", e);
        setSubjects([]);
        setSubjectsError("Failed to load subjects. Is backend running on :5000?");
      } finally {
        if (alive) setSubjectsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const finalSubject = useMemo(() => {
    if (subject === "Other") return trimStr(otherCategory) || "Other";
    return subject;
  }, [subject, otherCategory]);

  // ===== Availability helpers =====
  const updateAvailability = (index, field, value) => {
    setAvailability((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const toggleDay = (index, day) => {
    setAvailability((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const days = a.days.includes(day) ? a.days.filter((d) => d !== day) : [...a.days, day];
        return { ...a, days };
      })
    );
  };

  const addAvailability = () => setAvailability((prev) => [...prev, emptyAvailability()]);

  const removeAvailability = (index) => {
    setAvailability((prev) => {
      if (prev.length === 1) {
        Alert.alert("Notice", "You must have at least one availability.");
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ===== Validation =====
  const validate = () => {
  if (!type) return "Please select Course Tutoring or Course Discussion.";
  if (!trimStr(courseName)) return "Please enter a course name.";
  if (!finalSubject) return "Please select a subject.";

  for (let i = 0; i < availability.length; i++) {
    const a = availability[i];

    if (!a.days?.length) return `Availability #${i + 1}: pick at least one day.`;
    if (!trimStr(a.start) || !trimStr(a.end))
      return `Availability #${i + 1}: start and end time are required.`;

    // ✅ enforce HH:MM with minutes (12-hour because you use AM/PM toggles)
    if (!isValidHHMM12(a.start) || !isValidHHMM12(a.end)) {
      return `Availability #${i + 1}: time must be in H:MM or HH:MM, e.g., 9:30 or 12:00.`;
    }

    const s = to24HourMobile(trimStr(a.start), a.startAMPM);
    const e = to24HourMobile(trimStr(a.end), a.endAMPM);
    if (!s || !e) return `Availability #${i + 1}: invalid time.`;

    if (a.mode === "IRL" && !trimStr(a.location))
      return `Availability #${i + 1}: location is required for IRL.`;
  }

  return null;
};

  // ===== Submit =====
  const createOffering = async () => {
    console.log("🟢 Create Offering pressed");

    const error = validate();
    if (error) {
      console.log("🔴 validate failed:", error);
      Alert.alert("Fix this", error);
      return;
    }

    const educatorId = await getStoredUserId();
    console.log("🧾 educatorId:", educatorId);

    if (!educatorId) {
      Alert.alert("Not logged in", "Please log in again.");
      router.replace("/auth/login");
      return;
    }

    const payload = {
      type,
      subject: finalSubject,
      courseName: trimStr(courseName),
      courseCode: trimStr(courseCode),
      description: trimStr(description),
      availability: availability.map((a) => ({
  days: a.days,

  // ✅ send what Booking/backend expects
  startTime: to24HourMobile(trimStr(a.start), a.startAMPM),
  endTime: to24HourMobile(trimStr(a.end), a.endAMPM),

  // optional: keep originals if you like
  startAmPm: a.startAMPM,
  endAmPm: a.endAMPM,

  mode: a.mode, // "Online" or "IRL"
  location: trimStr(a.location),
})),
      educatorId,
      createdAt: new Date().toISOString(),
    };

    console.log("📦 payload:", payload);

    try {
      setSubmitting(true);

    const msToken = await getMsAccessToken();

    const res = await fetch(`${API_BASE}/api/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(msToken ? { Authorization: `Bearer ${msToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

      const data = await safeJson(res);
      console.log("🌐 create course response:", res.status, data);

      if (!res.ok) {
        Alert.alert("Server Error", data?.message || `Failed (${res.status})`);
        return;
      }

      Alert.alert("Success", "Course offering created.", [
        { text: "OK", onPress: () => router.replace("/educatoraccount") },
      ]);
      if (res.ok) {
        console.log("✅ Offering created, going home now");
        router.replace("/home");
        return;
      }
    } catch (e) {
      console.error("❌ create offering error:", e);
      Alert.alert("Error", String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  // ===== UI =====
  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topBtn} hitSlop={10}>
          <Text style={styles.topBtnText}>← Back</Text>
        </Pressable>

        <Text style={styles.topTitle}>Create Offering</Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.h2}>Create Course Offering</Text>

          {/* Type */}
          <Text style={styles.label}>Type of Offering</Text>
          <View style={styles.row}>
            <Pressable
              hitSlop={10}
              style={[styles.pill, type === "tutoring" && styles.pillActive]}
              onPress={() => setType("tutoring")}
            >
              <Text style={[styles.pillText, type === "tutoring" && styles.pillTextActive]}>
                Tutoring
              </Text>
            </Pressable>

            <Pressable
              hitSlop={10}
              style={[styles.pill, type === "discussion" && styles.pillActive]}
              onPress={() => setType("discussion")}
            >
              <Text style={[styles.pillText, type === "discussion" && styles.pillTextActive]}>
                Discussion
              </Text>
            </Pressable>
          </View>

          {/* Subject */}
          <Text style={[styles.label, { marginTop: 14 }]}>Subject Category</Text>

          {subjectsLoading ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : subjectsError ? (
            <Text style={styles.errorText}>{subjectsError}</Text>
          ) : (
            <View style={styles.rowWrap}>
              {subjects.map((s) => (
                <Pressable
                  key={s._id}
                  hitSlop={8}
                  style={[styles.chip, subject === s.subject_name && styles.chipActive]}
                  onPress={() => setSubject(s.subject_name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      subject === s.subject_name && styles.chipTextActive,
                    ]}
                  >
                    {s.subject_name}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                hitSlop={8}
                style={[styles.chip, subject === "Other" && styles.chipActive]}
                onPress={() => setSubject("Other")}
              >
                <Text style={[styles.chipText, subject === "Other" && styles.chipTextActive]}>
                  Other
                </Text>
              </Pressable>
            </View>
          )}

          {subject === "Other" && (
            <>
              <Text style={styles.label}>Course Category</Text>
              <TextInput
                style={styles.input}
                value={otherCategory}
                onChangeText={setOtherCategory}
                placeholder="Enter category name"
              />
            </>
          )}

          {/* Course fields */}
          <Text style={styles.label}>Course Name</Text>
          <TextInput style={styles.input} value={courseName} onChangeText={setCourseName} />

          <Text style={styles.label}>Course Code</Text>
          <TextInput style={styles.input} value={courseCode} onChangeText={setCourseCode} />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Availability */}
          <Text style={[styles.label, { marginTop: 10 }]}>Availability</Text>

          {availability.map((a, i) => (
            <View key={i} style={styles.availCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.availTitle}>Availability #{i + 1}</Text>
                {availability.length > 1 && (
                  <Pressable onPress={() => removeAvailability(i)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>×</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.smallLabel}>Days</Text>
              <View style={styles.rowWrap}>
                {DAYS.map((d) => {
                  const active = a.days.includes(d);
                  return (
                    <Pressable
                      key={d}
                      hitSlop={8}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => toggleDay(i, d)}
                    >
                      <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.smallLabel}>Time</Text>
              <View style={styles.row}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Start</Text>
                 <TextInput
                    style={styles.input}
                    value={a.start}
                    onChangeText={(v) => updateAvailability(i, "start", autoFormatTimeInput(v))}
                    onBlur={() =>
                      updateAvailability(i, "start", normalizeTimeOnBlur(a.start))
                    }
                    placeholder="9:00"
                    autoCorrect={false}
                    maxLength={5}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                  />
                  <View style={styles.row}>
                    {AMPM.map((ap) => (
                      <Pressable
                        key={ap}
                        hitSlop={8}
                        style={[styles.pillSmall, a.startAMPM === ap && styles.pillSmallActive]}
                        onPress={() => updateAvailability(i, "startAMPM", ap)}
                      >
                        <Text
                          style={[
                            styles.pillSmallText,
                            a.startAMPM === ap && styles.pillSmallTextActive,
                          ]}
                        >
                          {ap}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ width: 12 }} />

                <View style={styles.timeBox}>
                  <TextInput
                    style={styles.input}
                    value={a.end}
                    onChangeText={(v) => updateAvailability(i, "end", autoFormatTimeInput(v))}
                    onBlur={() =>
                      updateAvailability(i, "end", normalizeTimeOnBlur(a.end))
                    }
                    placeholder="3:30"
                    autoCorrect={false}
                    maxLength={5}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                  />z

                  <View style={styles.row}>
                    {AMPM.map((ap) => (
                      <Pressable
                        key={ap}
                        hitSlop={8}
                        style={[styles.pillSmall, a.endAMPM === ap && styles.pillSmallActive]}
                        onPress={() => updateAvailability(i, "endAMPM", ap)}
                      >
                        <Text
                          style={[
                            styles.pillSmallText,
                            a.endAMPM === ap && styles.pillSmallTextActive,
                          ]}
                        >
                          {ap}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.smallLabel}>Mode</Text>
              <View style={styles.row}>
                {MODES.map((m) => (
                  <Pressable
                    key={m}
                    hitSlop={10}
                    style={[styles.pill, a.mode === m && styles.pillActive]}
                    onPress={() => updateAvailability(i, "mode", m)}
                  >
                    <Text style={[styles.pillText, a.mode === m && styles.pillTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              {a.mode === "IRL" && (
                <>
                  <Text style={styles.smallLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={a.location}
                    onChangeText={(v) => updateAvailability(i, "location", v)}
                    placeholder="Enter location"
                  />
                </>
              )}
            </View>
          ))}

          <Pressable style={styles.addAvailBtn} onPress={addAvailability} hitSlop={10}>
            <Text style={styles.addAvailText}>+ Add Availability</Text>
          </Pressable>

          <View style={{ height: 14 }} />

          <Pressable
            hitSlop={12}
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            onPress={() => {
              console.log("🟦 Pressable hit");
              createOffering();
            }}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? "Creating…" : "Create Offering"}
            </Text>
          </Pressable>

          <Pressable
            hitSlop={12}
            style={[styles.secondaryBtn, submitting && { opacity: 0.6 }]}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </Pressable>

          <View style={{ height: 8 }} />
          <Text style={styles.hint}>
            Tip: If nothing happens, open console and check for 🟦 Pressable hit and 🟢 Create Offering pressed.
          </Text>
        </View>
      </ScrollView>
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
  topTitle: { fontSize: 16, fontWeight: "900" },
  topBtn: { paddingVertical: 6, paddingHorizontal: 8, width: 60 },
  topBtnText: { fontWeight: "800" },

  content: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },

  h2: { fontSize: 18, fontWeight: "900", marginBottom: 12 },

  label: { marginTop: 12, fontWeight: "800", color: "#222" },
  smallLabel: { marginTop: 10, fontWeight: "800", color: "#333", fontSize: 12 },

  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },

  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  pill: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pillActive: { backgroundColor: "#111" },
  pillText: { fontWeight: "900" },
  pillTextActive: { color: "#fff" },

  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { fontWeight: "800", color: "#222" },
  chipTextActive: { color: "#fff" },

  errorText: { marginTop: 10, color: "crimson", fontWeight: "700" },

  availCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
  },
  availTitle: { fontWeight: "900" },

  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { fontWeight: "900", fontSize: 16 },

  dayChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dayChipActive: { backgroundColor: "#111", borderColor: "#111" },
  dayChipText: { fontWeight: "800", color: "#222" },
  dayChipTextActive: { color: "#fff" },

  timeBox: { flex: 1, minWidth: 150 },
  timeLabel: { fontSize: 12, fontWeight: "900", color: "#333" },

  pillSmall: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginRight: 8,
  },
  pillSmallActive: { backgroundColor: "#111" },
  pillSmallText: { fontWeight: "900" },
  pillSmallTextActive: { color: "#fff" },

  addAvailBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
  },
  addAvailText: { fontWeight: "900" },

  primaryBtn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111",
  },
  secondaryBtnText: { fontWeight: "900" },

  hint: { marginTop: 10, color: "#666", fontSize: 12 },
});