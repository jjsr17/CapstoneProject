// /app/auth.js
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveAuth(user) {
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

export async function getStoredUserId() {
  if (Platform.OS === "web") return localStorage.getItem("mongoUserId");
  return AsyncStorage.getItem("mongoUserId");
}

export async function getStoredAccountType() {
  if (Platform.OS === "web") return localStorage.getItem("accountType");
  return AsyncStorage.getItem("accountType");
}
