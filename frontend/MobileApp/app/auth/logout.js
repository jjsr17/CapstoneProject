import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

const tenantId = "03f750b3-6ffc-46b7-8ea9-dd6d95a85164";

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

async function clearSession() {
  const keys = Object.values(KS);

  if (Platform.OS === "web") {
    keys.forEach((k) => localStorage.removeItem(k));
  } else {
    await AsyncStorage.multiRemove(keys);
  }
}

async function getUseMsSso() {
  if (Platform.OS === "web") return (localStorage.getItem(KS.useMsSso) || "").toLowerCase() === "true";
  const v = await AsyncStorage.getItem(KS.useMsSso);
  return (v || "").toLowerCase() === "true";
}

export async function logoutMicrosoftAndClear() {
  const wasMs = await getUseMsSso();

  // Always clear your app session first
  await clearSession();

  // If they didn't use MS SSO, you're done.
  if (!wasMs) return;

  // End Microsoft SSO session too (otherwise next login may auto-succeed)
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: Platform.OS !== "web",
    projectNameForProxy: "@jjsr17/MobileApp",
  });

  const logoutUrl =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout` +
    `?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

  if (Platform.OS === "web") {
    window.location.href = logoutUrl;
    return;
  }

  // Native: open system browser to log out, then return to app
  await WebBrowser.openAuthSessionAsync(logoutUrl, redirectUri);
}