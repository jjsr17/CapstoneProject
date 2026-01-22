// app/auth/ms-login.jsx
import React, { useCallback, useMemo } from "react";
import { View, Text, Button, Alert, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";
const clientId = "b8a0b68a-5858-4d1c-a0c3-9d52db4696de";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000"; // your LAN IP

export default function MsLoginScreen() {
  const apiUrl = useMemo(() => (Platform.OS === "web" ? API_WEB : API_DEVICE), []);
  const discovery = AuthSession.useAutoDiscovery(
    `https://login.microsoftonline.com/${tenantId}/v2.0`
  );

  const signIn = useCallback(async () => {
        try {
        if (!discovery) {
            Alert.alert("Loading", "Auth discovery still loading. Try again.");
            return;
        }

        const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    projectNameForProxy: "@jjsr17/mobileApp",
    });


      const req = new AuthSession.AuthRequest({
        clientId,
        scopes: ["openid", "profile", "email"],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce: "nonce" },
      });

      const result = await req.promptAsync(discovery, { useProxy: true });
      if (result.type !== "success") return;

      const idToken = result.params.id_token;
      console.log("ID TOKEN:", idToken);

      const resp = await fetch(`${apiUrl}/auth/ms-login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const raw = await resp.text();
      console.log("ms-login status:", resp.status);
      console.log("ms-login raw:", raw);

      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!resp.ok) {
        Alert.alert("ms-login failed", data?.message || raw || `HTTP ${resp.status}`);
        return;
      }

      const user = data?.user;

      // ✅ HARD FAIL if backend doesn't return what we need
      if (!user?._id || !user?.accountType) {
        Alert.alert(
          "Backend response missing fields",
          "Your /auth/ms-login must return user._id and user.accountType."
        );
        return;
      }

      // ✅ store for Account + EducatorAccount GraphQL pages
      await AsyncStorage.setItem("mongoUserId", String(user._id));
      await AsyncStorage.setItem("accountType", String(user.accountType));

      // ✅ route based on role
      if (user.accountType === "educator") router.replace("/educatoraccount");
      else router.replace("/account");
    } catch (e) {
      console.error("MS login error:", e);
      Alert.alert("MS login error", String(e?.message ?? e));
    }
  }, [apiUrl, discovery]);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Microsoft Sign-In
      </Text>
      <Button title="Sign in with Microsoft" onPress={signIn} />
    </View>
  );
}
