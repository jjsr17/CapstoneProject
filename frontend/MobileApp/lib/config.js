// /app/config.js
import { Platform } from "react-native";

export const API_BASE = Platform.OS === "web"
  ? "http://localhost:5000"      // for browser
  : "http://192.168.86.240:5000"; // your computer LAN IP, mobile devices

export const GRAPHQL_URL = `${API_BASE}/graphql`;
