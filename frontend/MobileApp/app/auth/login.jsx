// MobileApp/app/auth/login.jsx
import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";
const clientId = "b8a0b68a-5858-4d1c-a0c3-9d52db4696de";

// ✅ Backend base (no /graphql here)
const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.22:5000"; // ✅ match your working LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

// ✅ Keep keys consistent with Messages + web app
const KS = {
  useMsSso: "useMsSso",
  msAccessToken: "msAccessToken",
  msGraphAccessToken: "msGraphAccessToken",
  mongoUserId: "mongoUserId",
  accountType: "accountType",
  tutorId: "tutorId",
  profileComplete: "profileComplete",
  displayName: "displayName",
};

async function saveAuth(user) {
  const mongoUserId = user?._id ? String(user._id) : "";
  const accountType = user?.accountType ? String(user.accountType) : "";
  const profileComplete = String(!!user?.profileComplete);

  if (!mongoUserId) return;

  if (Platform.OS === "web") {
    localStorage.setItem(KS.mongoUserId, mongoUserId);
    localStorage.setItem(KS.tutorId, mongoUserId);
    localStorage.setItem(KS.accountType, accountType);
    localStorage.setItem(KS.profileComplete, profileComplete);
  } else {
    await AsyncStorage.setItem(KS.mongoUserId, mongoUserId);
    await AsyncStorage.setItem(KS.tutorId, mongoUserId);
    await AsyncStorage.setItem(KS.accountType, accountType);
    await AsyncStorage.setItem(KS.profileComplete, profileComplete);
  }

  const name =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.user_email || "User";

  if (Platform.OS === "web") localStorage.setItem(KS.displayName, name);
  else await AsyncStorage.setItem(KS.displayName, name);
}

async function saveMsTokens(accessToken) {
  if (!accessToken) return;

  if (Platform.OS === "web") {
    localStorage.setItem(KS.useMsSso, "true");
    localStorage.setItem(KS.msAccessToken, accessToken);
    localStorage.setItem(KS.msGraphAccessToken, accessToken);
  } else {
    await AsyncStorage.setItem(KS.useMsSso, "true");
    await AsyncStorage.setItem(KS.msAccessToken, accessToken);
    await AsyncStorage.setItem(KS.msGraphAccessToken, accessToken);
  }
}

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const discovery = AuthSession.useAutoDiscovery(
    `https://login.microsoftonline.com/${tenantId}/v2.0`
  );

  // ✅ Microsoft login: AUTH CODE (PKCE) -> exchange for access token -> call GraphQL me
  const loginWithMicrosoft = useCallback(async () => {
    try {
      if (!discovery) {
        Alert.alert("Loading", "Auth discovery is still loading. Try again.");
        return;
      }

      const projectNameForProxy = "@jjsr17/MobileApp";

      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: Platform.OS !== "web",
        projectNameForProxy,
      });

      const req = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: [
          "openid",
          "profile",
          "email",
          "offline_access",
          // ✅ Graph scopes (adjust based on your Teams features)
          "https://graph.microsoft.com/User.Read",
          "https://graph.microsoft.com/Chat.ReadWrite",
        ],
      });

      const result = await req.promptAsync(discovery, {
        useProxy: Platform.OS !== "web",
      });

      console.log("AUTH RESULT:", result);

      if (result.type !== "success") {
        Alert.alert("Login cancelled", "Microsoft login was cancelled.");
        return;
      }

      const code = result.params?.code;
      if (!code) {
        Alert.alert("Error", "No authorization code returned.");
        return;
      }

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri,
          extraParams: {
            code_verifier: req.codeVerifier,
          },
        },
        discovery
      );

      const accessToken = tokenResult.accessToken;
      if (!accessToken) {
        Alert.alert("Error", "No access token returned.");
        return;
      }

      await saveMsTokens(accessToken);
      console.log("ACCESS TOKEN saved:", accessToken.slice(0, 25) + "…");

      // ✅ Use GraphQL "me" like your web app
      const gqlResp = await fetch(`${API_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query Me {
              me {
                _id
                accountType
                profileComplete
                user_email
                firstName
                lastName
              }
            }
          `,
        }),
      });

      const gqlJson = await gqlResp.json();
      const me = gqlJson?.data?.me;

      if (me?._id) {
        await saveAuth(me);

        if (me.profileComplete) router.replace("/home");
        else router.replace("/auth/signup");

        return;
      }

      router.replace("/auth/signup");
    } catch (err) {
      console.error(err);
      Alert.alert("Login error", err?.message ?? "Something went wrong.");
    }
  }, [discovery]);

  // ✅ Local username/password login (kept)
  const handleLogin = useCallback(async () => {
    try {
      if (!username || !password) {
        Alert.alert("Error", "Please enter username and password");
        return;
      }

      // local mode
      if (Platform.OS === "web") {
        localStorage.setItem(KS.useMsSso, "false");
        localStorage.removeItem(KS.msAccessToken);
        localStorage.removeItem(KS.msGraphAccessToken);
      } else {
        await AsyncStorage.setItem(KS.useMsSso, "false");
        await AsyncStorage.removeItem(KS.msAccessToken);
        await AsyncStorage.removeItem(KS.msGraphAccessToken);
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
      router.replace("/postlogin");
    } catch (e) {
      Alert.alert("Login error", String(e?.message ?? e));
    }
  }, [username, password]);

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

      <Text
          style={styles.footerText}
          onPress={async () => {
            // force LOCAL signup mode
            if (Platform.OS === "web") {
              localStorage.setItem(KS.useMsSso, "false");
              localStorage.removeItem(KS.msAccessToken);
              localStorage.removeItem(KS.msGraphAccessToken);
            } else {
              await AsyncStorage.setItem(KS.useMsSso, "false");
              await AsyncStorage.removeItem(KS.msAccessToken);
              await AsyncStorage.removeItem(KS.msGraphAccessToken);
            }

            router.push("/auth/signup");
          }}
        >
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
