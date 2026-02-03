// app/auth/login.jsx
import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";


WebBrowser.maybeCompleteAuthSession();

// Microsoft OAuth config
const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";
const clientId = "b8a0b68a-5858-4d1c-a0c3-9d52db4696de";

// Backend URLs
const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.4.30:5000"; // <-- your desktop LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

// Helper to save logged-in user
async function saveAuth(user) {
  const mongoUserId = user?._id ? String(user._id) : "";
  const accountType = user?.accountType ? String(user.accountType) : "";
  if (!mongoUserId) return;

  if (Platform.OS === "web") {
    localStorage.setItem("mongoUserId", mongoUserId);
    localStorage.setItem("accountType", accountType);
  } else {
    await AsyncStorage.setItem("mongoUserId", mongoUserId);
    await AsyncStorage.setItem("accountType", accountType);
  }
}

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const discovery = AuthSession.useAutoDiscovery(
    `https://login.microsoftonline.com/${tenantId}/v2.0`
  );

  // Microsoft login
  const loginWithMicrosoft = useCallback(async () => {
    try {
      if (!discovery) {
        Alert.alert("Loading", "Auth discovery is still loading. Try again.");
        return;
      }

      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: Platform.OS !== "web",
        projectNameForProxy: "@c4refree/MobileApp",
      });

      const req = new AuthSession.AuthRequest({
        clientId,
        scopes: ["openid", "profile", "email"],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce: "nonce" },
      });

      const result = await req.promptAsync(discovery, {
        useProxy: Platform.OS !== "web",
      });

      const idToken = result.params?.id_token;
      if (!idToken) {
        Alert.alert("Error", "No id_token returned.");
        return;
      }

      const resp = await fetch(`${API_URL}/auth/ms-login`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      });

      const text = await resp.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!resp.ok) {
        Alert.alert("Login failed", data?.message ?? "Server error");
        return;
      }

      await saveAuth(data.user);
      router.replace("/postlogin");
    } catch (err) {
      console.error(err);
      Alert.alert("Login error", err?.message ?? "Something went wrong.");
    }
  }, [discovery]);

  // Username/password login
  const handleLogin = async () => {
    try {
      if (!username || !password) {
        Alert.alert("Error", "Please enter username and password");
        return;
      }

      const resp = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        Alert.alert("Login failed", data?.message ?? "Server error");
        return;
      }

      await saveAuth(data.user);
      router.replace("/home");
    } catch (e) {
      Alert.alert("Login error", String(e?.message ?? e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Sign in with Microsoft" onPress={loginWithMicrosoft} />
      <Button title="Login" onPress={handleLogin} />

      <Text style={styles.footerText} onPress={() => router.push("/auth/signup")}>
        Don't have an account? Sign up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "#f5f5f5" },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 40, textAlign: "center", color: "#333" },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 8, padding: 12, marginBottom: 20 },
  footerText: { marginTop: 20, textAlign: "center", color: "#666" },
});
