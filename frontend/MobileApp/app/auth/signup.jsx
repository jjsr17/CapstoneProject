// app/auth/signup.jsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Platform } from "react-native";
import { router } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000"; // your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const signup = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          accountType: "student", // or educator
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        Alert.alert("Signup failed", data.message || "Error");
        return;
      }

      Alert.alert("Success", "Account created");
      router.replace("/auth/login");
    } catch (e) {
      Alert.alert("Network error", String(e));
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
