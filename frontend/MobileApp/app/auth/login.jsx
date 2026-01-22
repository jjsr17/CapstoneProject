import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from "react-native";
import { router } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";
const clientId = "b8a0b68a-5858-4d1c-a0c3-9d52db4696de";

// Backend base (NOT /graphql)
const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000"; // ✅ your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

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

  const loginWithMicrosoft = useCallback(async () => {
    try {
      if (!discovery) {
        Alert.alert("Loading", "Auth discovery is still loading. Try again.");
        return;
      }

      // Expo proxy works great in dev (web + device)
      const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
  // IMPORTANT: put your real Expo account + app slug here
  // example: "@jonathansewell/mobileapp"
  projectNameForProxy: "@YOUR_EXPO_USERNAME/YOUR_APP_SLUG",
});

const req = new AuthSession.AuthRequest({
  clientId,
  scopes: ["openid", "profile", "email"],
  redirectUri,
  responseType: AuthSession.ResponseType.IdToken,
  extraParams: { nonce: "nonce" },
});



      const authRequest = new AuthSession.AuthRequest({
        clientId,
        scopes: ["openid", "profile", "email"],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce: "nonce" },
      });

const result = await req.promptAsync(discovery, { useProxy: true });
      if (result.type !== "success") return;

      const idToken = result.params?.id_token;

      console.log("ID TOKEN:", idToken?.slice(0, 25) + "…"); // ✅ safe partial log

      const resp = await fetch(`${API_URL}/auth/ms-login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const raw = await resp.text();
      console.log("MS LOGIN status:", resp.status);
      console.log("MS LOGIN raw:", raw);

      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        Alert.alert("MS Login failed", data?.message || raw || `HTTP ${resp.status}`);
        return;
      }

      console.log("MS LOGIN PARSED JSON:", data);

      const user = data?.user;
      if (!user?._id) {
        Alert.alert("Login error", "Backend did not return user._id");
        return;
      }

      await saveAuth(user);

      // Route by account type
      if (user.accountType === "educator") {
        router.replace("/educatoraccount");
      } else {
        router.replace("/account");
      }
    } catch (e) {
      console.error("MS login error:", e);
      Alert.alert("MS Login error", String(e?.message ?? e));
    }
  }, [discovery]);

  // Your placeholder user/pass login (kept)
  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }
    router.push("/details");
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
