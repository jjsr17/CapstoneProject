// MobileApp/app/auth/signup.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

/** --------- API BASE --------- **/
const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.22:5000"; // your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

/** --------- Paths --------- **/
const SIGNUP_PATH = "/api/users/signup";
const GRAPHQL_PATH = "/graphql";

/** --------- Storage keys (match web) --------- **/
const LS = {
  useMsSso: "useMsSso",
  msAccessToken: "msAccessToken",
  mongoUserId: "mongoUserId",
  accountType: "accountType",
  tutorId: "tutorId",
  profileComplete: "profileComplete",
};

/** --------- Helpers --------- **/
async function getItem(key) {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return AsyncStorage.getItem(key);
}

async function setItem(key, value) {
  if (Platform.OS === "web") return localStorage.setItem(key, value);
  return AsyncStorage.setItem(key, value);
}

async function removeItem(key) {
  if (Platform.OS === "web") return localStorage.removeItem(key);
  return AsyncStorage.removeItem(key);
}

/** --------- GraphQL helpers --------- **/
async function fetchMe(API_URL, msToken) {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${msToken}`,
    },
    body: JSON.stringify({
      query: `
        query Me {
          me {
            firstName
            lastName
            user_email
          }
        }
      `,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || "Failed to load profile (me).";
    throw new Error(msg);
  }

  return json?.data?.me || null;
}

async function gqlRequest({ token, query, variables }) {
  const res = await fetch(`${API_URL}${GRAPHQL_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || `GraphQL error (${res.status})`;
    throw new Error(msg);
  }
  if (json?.errors?.length) throw new Error(json.errors[0].message);
  return json?.data;
}

const COMPLETE_PROFILE_MUTATION = `
  mutation CompleteProfile($input: CompleteProfileInput!) {
    completeProfile(input: $input) {
      _id
      accountType
      profileComplete
      user_email
      firstName
      lastName
      authProvider
      msOid
      msUpn
      teamsEnabled
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      firstName
      lastName
      user_email
    }
  }
`;

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

  /** --------- Detect auth mode (like web) --------- **/
  const [useMs, setUseMs] = useState(false);
  const [msToken, setMsToken] = useState("");

  const hasMsToken = !!msToken;
  const isMsMode = useMs === true && hasMsToken;
  const isLocalMode = !isMsMode;

  useEffect(() => {
    (async () => {
      const useMsSso = (await getItem(LS.useMsSso)) === "true";
      const token = (await getItem(LS.msAccessToken)) || "";
      setUseMs(useMsSso);
      setMsToken(token);
    })();
  }, []);
  /** --------- Form state (same fields as your mobile version) --------- **/
  const [accountType, setAccountType] = useState("student"); // student | educator

  // Names
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  // Contact + auth
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Passwords (local only)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Demographics
  const [gender, setGender] = useState(""); // "", "Male", "Female", "Other"
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [town, setTown] = useState("");
  const [stateField, setStateField] = useState("");
  const [country, setCountry] = useState("");

  // Student fields
  const [schoolName, setSchoolName] = useState("");
  const [educationLevel, setEducationLevel] = useState(""); // "", "school", "college"
  const [grade, setGrade] = useState("");
  const [collegeYear, setCollegeYear] = useState("");
  const [studentConcentration, setStudentConcentration] = useState("");
  const [degreeType, setDegreeType] = useState("Associate");

  // Educator fields
  const [educatorCollegeName, setEducatorCollegeName] = useState("");
  const [educatorDegree, setEducatorDegree] = useState("Bachelor");
  const [educatorConcentration, setEducatorConcentration] = useState("");
  const [credentialsFileName, setCredentialsFileName] = useState(""); // mobile: name only

  /** --------- Autofill from ME in MS mode --------- **/
 

  /** --------- Build payload (like web) --------- **/
  const payload = useMemo(() => {
    const ageNum =
      String(age).trim() === ""
        ? undefined
        : Number.isFinite(Number(age))
        ? Number(age)
        : undefined;

    const base = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      gender: gender.trim(), // "", "Male","Female","Other"
      age: ageNum,
      birthDate: birthDate.trim() || undefined,

      address: address.trim() || undefined,
      town: town.trim() || undefined,
      stateField: stateField.trim() || undefined,
      country: country.trim() || undefined,

      phone: phone.trim() || undefined,

      user_email: email.trim().toLowerCase(),
      accountType,

      // ✅ only send password for local
      password: isLocalMode ? password : undefined,
    };

    if (accountType === "student") {
      return {
        ...base,
        student: {
          schoolName: schoolName.trim() || undefined,
          educationLevel: educationLevel.trim().toLowerCase(),// "", "school", "college"
          grade: grade.trim() || undefined,
          collegeYear: collegeYear.trim() || undefined,
          concentration: studentConcentration.trim() || undefined,
          degreeType: degreeType.trim() || undefined,
        },
      };
    }

    return {
      ...base,
      educator: {
        collegeName: educatorCollegeName.trim() || undefined,
        degree: educatorDegree.trim() || undefined,
        concentration: educatorConcentration.trim() || undefined,
        credentialsFileName: credentialsFileName.trim() || undefined,
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
    email,
    password,
    isLocalMode,
    // student
    schoolName,
    educationLevel,
    grade,
    collegeYear,
    studentConcentration,
    degreeType,
    // educator
    educatorCollegeName,
    educatorDegree,
    educatorConcentration,
    credentialsFileName,
  ]);

  const validate = useCallback(() => {
    const edu = educationLevel.trim().toLowerCase();

    if (!payload.firstName) return "First Name is required.";
    if (!payload.lastName) return "Last Name is required.";
    if (!payload.user_email) return "Email is required.";
    if (!["student", "educator"].includes(accountType)) return "Invalid account type.";

    if (isLocalMode) {
      if (!password) return "Password is required.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }

    if (!["", "Male", "Female", "Other"].includes(gender.trim())) {
      return 'Gender must be "Male", "Female", "Other", or blank.';
    }

    if ( accountType === "student" && !["", "school", "college"].includes(edu)) {
      return 'Education Level must be "school", "college", or blank.';
    }


    if (String(age).trim() !== "") {
      const n = Number(age);
      if (!Number.isFinite(n) || n < 0) return "Age must be a valid number (0+).";
    }

    return null;
  }, [payload, accountType, isLocalMode, password, confirmPassword, gender, age, educationLevel]);

  /** --------- Submit (match web logic) --------- **/
  useEffect(() => {
  (async () => {
    try {
      if (!isMsMode || !msToken) return;

      const me = await fetchMe(API_URL, msToken);
      if (!me) return;

      setFirstName((v) => (v ? v : me.firstName || ""));
      setLastName((v) => (v ? v : me.lastName || ""));
      setEmail((v) => (v ? v : me.user_email || ""));
    } catch (e) {
      console.log("ME autofill failed:", e?.message || e);
    }
  })();
}, [isMsMode, msToken]);

  const handleSignup = async () => {
  try {
    console.log("handleSignup() start");

    const err = validate();
    if (err) {
      Alert.alert("Fix this", err);
      return;
    }

    setLoading(true);

    // 1) REST signup (same as web)
    const url = `${API_URL}${SIGNUP_PATH}`;
    const headers = { "Content-Type": "application/json" };
    if (isMsMode && msToken) headers.Authorization = `Bearer ${msToken}`;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { message: raw };
    }

    if (!resp.ok) {
      Alert.alert("Signup failed", data?.message || data?.error || `HTTP ${resp.status}`);
      return;
    }

    // 2) IMPORTANT: In MS mode, flip teamsEnabled by calling completeProfile (like web)
    if (isMsMode && msToken) {
      const gqlData = await gqlRequest({
        token: msToken,
        query: COMPLETE_PROFILE_MUTATION,
        variables: {
          input: {
            accountType,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || "",
          },
        },
      });

      const user = gqlData?.completeProfile;
      if (!user?._id) {
        Alert.alert("Microsoft profile completion failed", "No user returned.");
        return;
      }

      // store the same stuff as web
      await setItem(LS.mongoUserId, String(user._id));
      await setItem(LS.tutorId, String(user._id));
      await setItem(LS.accountType, String(user.accountType || accountType));
      await setItem(LS.profileComplete, String(!!user.profileComplete));

      // ✅ go to home (or educatoraccount)
      router.replace(user.accountType === "educator" ? "/educatoraccount" : "/home");
      return;
    }

    // 3) Local mode (optional) store returned id if your backend sends it
    const userId = data?.userId;
    if (userId) {
      await setItem(LS.mongoUserId, String(userId));
      await setItem(LS.tutorId, String(userId));
    }
    await setItem(LS.accountType, String(accountType));
    await setItem(LS.profileComplete, "true");

    router.replace(accountType === "educator" ? "/educatoraccount" : "/home");
  } catch (e) {
    console.error("handleSignup error:", e);
    Alert.alert("Network/Crash", String(e?.message ?? e));
  } finally {
    setLoading(false);
  }
};

  const onBack = useCallback(async () => {
    // optional: mimic web "Back goes to login"
    router.replace("/auth/login");
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>

      {/* Mode info (helpful while debugging) */}
      <Text style={styles.modeText}>
        Mode: {isMsMode ? "Microsoft SSO" : "Local"}
      </Text>

      <Text style={styles.section}>Account Type</Text>
      <View style={styles.pillRow}>
        <Pill label="Student" active={accountType === "student"} onPress={() => setAccountType("student")} />
        <Pill
          label="Educator"
          active={accountType === "educator"}
          onPress={() => setAccountType("educator")}
        />
      </View>

      <Text style={styles.section}>Identity</Text>
      <TextInput style={styles.input} placeholder="First Name *" value={firstName} onChangeText={setFirstName} editable={!loading} />
      <TextInput style={styles.input} placeholder="Middle Name" value={middleName} onChangeText={setMiddleName} editable={!loading} />
      <TextInput style={styles.input} placeholder="Last Name *" value={lastName} onChangeText={setLastName} editable={!loading} />

      <Text style={styles.section}>Demographics (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder='Gender (Male / Female / Other)'
        value={gender}
        onChangeText={setGender}
        editable={!loading}
      />
      <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" editable={!loading} />
      <TextInput style={styles.input} placeholder="Birth Date (MM/DD/YYYY)" value={birthDate} onChangeText={setBirthDate} editable={!loading} />

      <Text style={styles.section}>Address (optional)</Text>
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} editable={!loading} />
      <TextInput style={styles.input} placeholder="Town" value={town} onChangeText={setTown} editable={!loading} />
      <TextInput style={styles.input} placeholder="State" value={stateField} onChangeText={setStateField} editable={!loading} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} editable={!loading} />

      <Text style={styles.section}>Contact</Text>
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />

      <Text style={styles.section}>Email</Text>
      <TextInput
        style={[styles.input, !isLocalMode && styles.inputReadOnly]}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading && isLocalMode} // ✅ readOnly in MS mode
      />

      {/* Passwords ONLY for local mode */}
      {isLocalMode && (
        <>
          <Text style={styles.section}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </>
      )}

      {accountType === "student" ? (
        <>
          <Text style={styles.section}>Student (optional)</Text>
          <TextInput style={styles.input} placeholder="School Name" value={schoolName} onChangeText={setSchoolName} editable={!loading} />
         <View style={styles.pillRow}>
          <Pill
              label="School"
              active={educationLevel === "school"}
              onPress={() => setEducationLevel("school")}
            />

            <Pill
              label="College"
              active={educationLevel === "college"}
              onPress={() => setEducationLevel("college")}
            />

        </View>

          <TextInput style={styles.input} placeholder="Grade" value={grade} onChangeText={setGrade} editable={!loading} />
          <TextInput style={styles.input} placeholder="College Year" value={collegeYear} onChangeText={setCollegeYear} editable={!loading} />
          <TextInput style={styles.input} placeholder="Concentration" value={studentConcentration} onChangeText={setStudentConcentration} editable={!loading} />

          <TextInput
            style={styles.input}
            placeholder="Degree Type (Associate/Bachelor/Master)"
            value={degreeType}
            onChangeText={setDegreeType}
            editable={!loading}
          />
        </>
      ) : (
        <>
          <Text style={styles.section}>Educator (optional)</Text>
          <TextInput style={styles.input} placeholder="College Name" value={educatorCollegeName} onChangeText={setEducatorCollegeName} editable={!loading} />
          <TextInput style={styles.input} placeholder="Degree (Bachelor/Master/Doctorate)" value={educatorDegree} onChangeText={setEducatorDegree} editable={!loading} />
          <TextInput style={styles.input} placeholder="Concentration" value={educatorConcentration} onChangeText={setEducatorConcentration} editable={!loading} />
          <TextInput
            style={styles.input}
            placeholder="Credentials file name (PDF)"
            value={credentialsFileName}
            onChangeText={setCredentialsFileName}
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
        // <Pressable style={styles.primaryBtn} onPress={handleSignup} accessibilityRole="button" hitSlop={10}>
        //   <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        // </Pressable>
         <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            console.log("CREATE ACCOUNT pressed ✅");
            Alert.alert("Pressed", "Create Account button is firing");
            handleSignup();
          }}
        >
          <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
        </Pressable>

      )}

      <Pressable style={styles.secondaryBtn} onPress={onBack} disabled={loading} accessibilityRole="button">
        <Text style={styles.secondaryBtnText}>BACK</Text>
      </Pressable>

      <Text style={styles.debug}>POST {API_URL}{SIGNUP_PATH}</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  modeText: { textAlign: "center", color: "#666", marginBottom: 10 },

  section: { marginTop: 14, fontSize: 16, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  inputReadOnly: {
    backgroundColor: "#f2f2f2",
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
