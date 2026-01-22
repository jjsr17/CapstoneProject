// app/auth/signup.jsx
// Final polished Signup for Expo Router + MongoDB
// - POSTs to /api/users/signup
// - Works on web + physical device (LAN IP)
// - Clean validation + clear errors (never silent)
// - Payload matches your backend expectations (email field is OK)

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000"; // ✅ your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

const SIGNUP_PATH = "/api/users/signup";

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);

  // Use window.alert on web so you ALWAYS see messages
  const notify = useCallback((title, msg) => {
    const text = title ? `${title}\n\n${msg ?? ""}` : String(msg ?? "");
    if (Platform.OS === "web") window.alert(text);
    else Alert.alert(title || "Message", String(msg ?? ""));
  }, []);

  // ===== Required =====
  const [accountType, setAccountType] = useState("student"); // student | educator
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [user_email, setUser_email] = useState("");
  const [password, setPassword] = useState("");

  // ===== Optional =====
  const [gender, setGender] = useState(""); // Male | Female | Other | ""
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [stateField, setStateField] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  // ===== Student nested =====
  const [student_schoolName, setStudent_schoolName] = useState("");
  const [student_educationLevel, setStudent_educationLevel] = useState(""); // school | college | ""
  const [student_grade, setStudent_grade] = useState("");
  const [student_collegeYear, setStudent_collegeYear] = useState("");
  const [student_concentration, setStudent_concentration] = useState("");
  const [student_degreeType, setStudent_degreeType] = useState("");

  // ===== Educator nested =====
  const [educator_collegeName, setEducator_collegeName] = useState("");
  const [educator_degree, setEducator_degree] = useState("");
  const [educator_concentration, setEducator_concentration] = useState("");
  const [educator_credentialsFileName, setEducator_credentialsFileName] = useState("");

  const payload = useMemo(() => {
    const base = {
      accountType,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),

      // Your backend route validates p.email (and/or p.user_email),
      // so sending `email` here is correct.
      email: user_email.trim().toLowerCase(),
      password,

      gender: gender.trim(),
      age: age ? Number(age) : undefined,
      birthDate: birthDate.trim(),

      address: address.trim(),
      town: town.trim(),
      stateField: stateField.trim(),
      country: country.trim(),
      phone: phone.trim(),
    };

    if (accountType === "student") {
      base.student = {
        schoolName: student_schoolName.trim(),
        educationLevel: student_educationLevel, // school | college | ""
        grade: student_grade.trim(),
        collegeYear: student_collegeYear.trim(),
        concentration: student_concentration.trim(),
        degreeType: student_degreeType.trim(),
      };
    } else {
      base.educator = {
        collegeName: educator_collegeName.trim(),
        degree: educator_degree.trim(),
        concentration: educator_concentration.trim(),
        credentialsFileName: educator_credentialsFileName.trim(),
      };
    }

    return base;
  }, [
    accountType,
    firstName,
    middleName,
    lastName,
    user_email,
    password,
    gender,
    age,
    birthDate,
    address,
    town,
    stateField,
    country,
    phone,
    student_schoolName,
    student_educationLevel,
    student_grade,
    student_collegeYear,
    student_concentration,
    student_degreeType,
    educator_collegeName,
    educator_degree,
    educator_concentration,
    educator_credentialsFileName,
  ]);

  const validate = () => {
    if (!["student", "educator"].includes(accountType)) return "Account type must be student or educator.";
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";

    const email = user_email.trim();
    if (!email) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";

    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    if (age && isNaN(Number(age))) return "Age must be a number.";

    const allowedGender = ["Male", "Female", "Other", ""];
    if (!allowedGender.includes(gender.trim())) {
      return "Gender must be Male, Female, Other, or empty.";
    }

    const allowedEdu = ["school", "college", ""];
    if (accountType === "student" && !allowedEdu.includes(student_educationLevel)) {
      return "Student educationLevel must be 'school', 'college', or empty.";
    }

    return null;
  };

  const handleSignup = async () => {
    console.log("✅ Create Account pressed");

    if (loading) {
      console.log("⏳ Ignored: already loading");
      return;
    }

    const err = validate();
    if (err) {
      console.log("❌ Validation failed:", err);
      notify("Signup error", err);
      return;
    }

    setLoading(true);

    try {
      const url = `${API_URL}${SIGNUP_PATH}`;
      console.log("➡️ POST", url);
      console.log("➡️ Payload", payload);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await resp.text();
      console.log("⬅️ Response", resp.status, raw);

      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        const msg = data?.message || data?.error || raw || `HTTP ${resp.status}`;
        notify("Signup failed", msg);
        return;
      }

      notify("Success", "Account created!");
      router.replace("/auth/login");
    } catch (e) {
      console.error("❌ Network error:", e);
      notify(
        "Network error",
        String(e?.message ?? e) +
          (Platform.OS !== "web"
            ? "\n\nIf testing on a phone, API_URL cannot be localhost. Use your laptop LAN IP."
            : "")
      );
    } finally {
      setLoading(false);
    }
  };

  const Pill = ({ label, active, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      disabled={loading}
      accessibilityRole="button"
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.section}>Account Type</Text>
      <View style={styles.pillRow}>
        <Pill label="Student" active={accountType === "student"} onPress={() => setAccountType("student")} />
        <Pill label="Educator" active={accountType === "educator"} onPress={() => setAccountType("educator")} />
      </View>

      <Text style={styles.section}>Identity</Text>
      <TextInput style={styles.input} placeholder="First Name *" value={firstName} onChangeText={setFirstName} editable={!loading} />
      <TextInput style={styles.input} placeholder="Middle Name" value={middleName} onChangeText={setMiddleName} editable={!loading} />
      <TextInput style={styles.input} placeholder="Last Name *" value={lastName} onChangeText={setLastName} editable={!loading} />

      <Text style={styles.section}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={user_email}
        onChangeText={setUser_email}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Text style={styles.section}>Demographics (optional)</Text>
      <TextInput style={styles.input} placeholder="Gender (Male/Female/Other)" value={gender} onChangeText={setGender} editable={!loading} />
      <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" editable={!loading} />
      <TextInput style={styles.input} placeholder="Birth Date (string)" value={birthDate} onChangeText={setBirthDate} editable={!loading} />

      <Text style={styles.section}>Address (optional)</Text>
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} editable={!loading} />
      <TextInput style={styles.input} placeholder="Town" value={town} onChangeText={setTown} editable={!loading} />
      <TextInput style={styles.input} placeholder="State" value={stateField} onChangeText={setStateField} editable={!loading} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} editable={!loading} />

      <Text style={styles.section}>Contact (optional)</Text>
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />

      {accountType === "student" ? (
        <>
          <Text style={styles.section}>Student (optional)</Text>
          <TextInput style={styles.input} placeholder="School Name" value={student_schoolName} onChangeText={setStudent_schoolName} editable={!loading} />
          <TextInput
            style={styles.input}
            placeholder="Education Level (school/college)"
            value={student_educationLevel}
            onChangeText={setStudent_educationLevel}
            editable={!loading}
          />
          <TextInput style={styles.input} placeholder="Grade" value={student_grade} onChangeText={setStudent_grade} editable={!loading} />
          <TextInput style={styles.input} placeholder="College Year" value={student_collegeYear} onChangeText={setStudent_collegeYear} editable={!loading} />
          <TextInput style={styles.input} placeholder="Concentration" value={student_concentration} onChangeText={setStudent_concentration} editable={!loading} />
          <TextInput style={styles.input} placeholder="Degree Type" value={student_degreeType} onChangeText={setStudent_degreeType} editable={!loading} />
        </>
      ) : (
        <>
          <Text style={styles.section}>Educator (optional)</Text>
          <TextInput style={styles.input} placeholder="College Name" value={educator_collegeName} onChangeText={setEducator_collegeName} editable={!loading} />
          <TextInput style={styles.input} placeholder="Degree" value={educator_degree} onChangeText={setEducator_degree} editable={!loading} />
          <TextInput style={styles.input} placeholder="Concentration" value={educator_concentration} onChangeText={setEducator_concentration} editable={!loading} />
          <TextInput
            style={styles.input}
            placeholder="Credentials File Name (optional)"
            value={educator_credentialsFileName}
            onChangeText={setEducator_credentialsFileName}
            editable={!loading}
          />
        </>
      )}

      <View style={{ height: 16 }} />

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 10 }}>Creating account…</Text>
        </View>
      ) : (
        <Pressable
          style={styles.primaryBtn}
          onPress={handleSignup}
          disabled={loading}
          accessibilityRole="button"
          hitSlop={10}
        >
          <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.secondaryBtn}
        onPress={() => router.replace("/auth/login")}
        disabled={loading}
        accessibilityRole="button"
>
  <Text style={styles.secondaryBtnText}>BACK</Text>
</Pressable>


      <Text style={styles.debug}>POST {API_URL}{SIGNUP_PATH}</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 10, textAlign: "center" },

  section: { marginTop: 14, fontSize: 16, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#fff",
  },

  pillRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  pillActive: { borderColor: "#1e90ff", backgroundColor: "#eaf3ff" },
  pillText: { fontWeight: "700" },
  pillTextActive: { color: "#1e90ff" },

  primaryBtn: {
    marginTop: 6,
    backgroundColor: "#1e90ff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: "#1976d2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  secondaryBtnText: { color: "#fff", fontWeight: "800", letterSpacing: 0.5 },

  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10 },

  debug: { marginTop: 12, textAlign: "center", color: "#666", fontSize: 12 },
});
