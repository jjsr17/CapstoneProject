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
const API_DEVICE = "http://192.168.4.30:5000"; // your LAN IP

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

      // ✅ Authorization Code + PKCE (correct for Expo)
      const req = new AuthSession.AuthRequest({
        clientId,
        scopes: ["openid", "profile", "email", "User.Read"],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      });

      const result = await req.promptAsync(discovery, { useProxy: true });

      // ✅ MUST check success first
      if (result.type !== "success") return;

      const code = result.params?.code;
      if (!code) {
        Alert.alert("MS login error", "Missing authorization code.");
        return;
      }

      // ✅ Exchange code -> access token
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code,
          redirectUri,
          extraParams: {
            code_verifier: req.codeVerifier, // required for PKCE
          },
        },
        discovery
      );

      const accessToken = tokenResult?.accessToken;
      if (!accessToken) {
        console.log("tokenResult:", tokenResult);
        Alert.alert("MS login error", "Failed to obtain access token.");
        return;
      }

      // ✅ Call your backend using the access token
      const resp = await fetch(`${apiUrl}/auth/ms-login`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
        data = { message: raw };
      }

      if (!resp.ok) {
        Alert.alert("ms-login failed", data?.message || data?.error || `HTTP ${resp.status}`);
        return;
      }

      const user = data?.user;
      if (!user?._id || !user?.accountType) {
        Alert.alert(
          "Backend response missing fields",
          "Your /auth/ms-login must return user._id and user.accountType."
        );
        return;
      }

      // ✅ Store tokens for signup autofill + GraphQL/me
      await AsyncStorage.setItem("useMsSso", "true");
      await AsyncStorage.setItem("msAccessToken", accessToken);

      // ✅ Store user identity like web
      await AsyncStorage.setItem("mongoUserId", String(user._id));
      await AsyncStorage.setItem("accountType", String(user.accountType));
      await AsyncStorage.setItem("tutorId", String(user._id));
      await AsyncStorage.setItem("profileComplete", String(!!user.profileComplete));

      // ✅ route based on role
      if (user.accountType === "educator") router.replace("/educatoraccount");
      else router.replace("/home");
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
