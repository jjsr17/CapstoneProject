import React, { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.4.30:5000"; // your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

const SIGNUP_PATH = "/api/users/signup";

function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);

  // Account type
  const [accountType, setAccountType] = useState("student"); // "student" | "educator"

  // Name
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  // Login
  const [user_email, setUser_email] = useState("");
  const [password, setPassword] = useState("");

  // Demographics (optional)
  const [gender, setGender] = useState(""); // "", "Male", "Female", "Other"
  const [age, setAge] = useState(""); // keep as string in UI; convert to number
  const [birthDate, setBirthDate] = useState("");

  // Address (optional)
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [stateField, setStateField] = useState("");
  const [country, setCountry] = useState("");

  // Contact (optional)
  const [phone, setPhone] = useState("");

  // Student fields (optional)
  const [student_schoolName, setStudent_schoolName] = useState("");
  const [student_educationLevel, setStudent_educationLevel] = useState(""); // "", "school", "college"
  const [student_grade, setStudent_grade] = useState("");
  const [student_collegeYear, setStudent_collegeYear] = useState("");
  const [student_concentration, setStudent_concentration] = useState("");
  const [student_degreeType, setStudent_degreeType] = useState("");

  // Educator fields (optional)
  const [educator_collegeName, setEducator_collegeName] = useState("");
  const [educator_degree, setEducator_degree] = useState("");
  const [educator_concentration, setEducator_concentration] = useState("");
  const [educator_credentialsFileName, setEducator_credentialsFileName] = useState("");

  const payload = useMemo(() => {
    // Convert age safely (optional)
    const ageNum =
      String(age).trim() === "" ? undefined : Number.isFinite(Number(age)) ? Number(age) : undefined;

    const base = {
      accountType, // required
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      gender: gender.trim(), // must be "", "Male", "Female", "Other"
      age: ageNum, // number or undefined
      birthDate: birthDate.trim() || undefined,

      address: address.trim() || undefined,
      town: town.trim() || undefined,
      stateField: stateField.trim() || undefined,
      country: country.trim() || undefined,

      phone: phone.trim() || undefined,

      user_email: user_email.trim().toLowerCase(), // required by schema
      password, // controller should hash -> passwordHash
    };

    if (accountType === "student") {
      return {
        ...base,
        student: {
          schoolName: student_schoolName.trim() || undefined,
          educationLevel: student_educationLevel.trim(), // "", "school", "college"
          grade: student_grade.trim() || undefined,
          collegeYear: student_collegeYear.trim() || undefined,
          concentration: student_concentration.trim() || undefined,
          degreeType: student_degreeType.trim() || undefined,
        },
      };
    }

    return {
      ...base,
      educator: {
        collegeName: educator_collegeName.trim() || undefined,
        degree: educator_degree.trim() || undefined,
        concentration: educator_concentration.trim() || undefined,
        credentialsFileName: educator_credentialsFileName.trim() || undefined,
      },
    };
  }, [
    accountType,
    firstName,
    middleName,
    lastName,
    gender,
    age,
    birthDate,
    address,
    town,
    stateField,
    country,
    phone,
    user_email,
    password,
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
    if (!payload.firstName) return "First Name is required.";
    if (!payload.lastName) return "Last Name is required.";
    if (!payload.user_email) return "Email is required.";
    if (!password) return "Password is required.";
    if (!["student", "educator"].includes(accountType)) return "Invalid account type.";

    // Backend enum: ["Male","Female","Other",""]
    if (!["", "Male", "Female", "Other"].includes(gender.trim())) {
      return 'Gender must be "Male", "Female", "Other", or blank.';
    }

    // Student enum: ["school","college",""]
    if (accountType === "student" && !["", "school", "college"].includes(student_educationLevel.trim())) {
      return 'Education Level must be "school", "college", or blank.';
    }

    // If age is provided, must be a number >= 0
    if (String(age).trim() !== "") {
      const n = Number(age);
      if (!Number.isFinite(n) || n < 0) return "Age must be a valid number (0+).";
    }

    return null;
  };

  const handleSignup = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Fix this", err);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}${SIGNUP_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        Alert.alert("Signup failed", data.message || `HTTP ${resp.status}`);
        return;
      }

      Alert.alert("Success", "Account created");
      router.replace("/auth/login");
    } catch (e) {
      Alert.alert("Network error", String(e));
    } finally {
      setLoading(false);
    }
  };

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
      <TextInput
        style={styles.input}
        placeholder='Gender ("Male" / "Female" / "Other")'
        value={gender}
        onChangeText={setGender}
        editable={!loading}
      />
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
            placeholder='Education Level ("school" / "college")'
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
            placeholder="Credentials File Name"
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
        <Pressable style={styles.primaryBtn} onPress={handleSignup} accessibilityRole="button" hitSlop={10}>
          <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        </Pressable>
      )}

      <Pressable style={styles.secondaryBtn} onPress={() => router.back()} disabled={loading} accessibilityRole="button">
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
