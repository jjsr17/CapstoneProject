import React, { useState, useCallback } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";
const clientId = "b8a0b68a-5858-4d1c-a0c3-9d52db4696de";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Hook must be inside the component
  const discovery = AuthSession.useAutoDiscovery(
    `https://login.microsoftonline.com/${tenantId}/v2.0`
  );

  const loginWithMicrosoft = useCallback(async () => {
    if (!discovery) {
      Alert.alert("Loading", "Auth discovery is still loading. Try again.");
      return;
    }

    // NOTE: for web, you often don't want useProxy; for dev it's okay.
    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

    const authRequest = new AuthSession.AuthRequest({
      clientId,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: {
        nonce: "nonce",
      },
    });

    const result = await authRequest.promptAsync(discovery, { useProxy: true });

    if (result.type !== "success") return;

    const idToken = result.params.id_token;
    const apiUrl = "http://localhost:5000";
    // not localhost if on phone
    const resp = await fetch(`${apiUrl}/auth/ms-login`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });

    const data = await resp.json();
    console.log("Logged in user:", data.user);

    router.push("/details");
  }, [discovery]);

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
