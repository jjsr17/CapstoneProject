<<<<<<< HEAD
// /app/config.js
import { Platform } from "react-native";

export const API_BASE = Platform.OS === "web"
  ? "http://localhost:5000"      // for browser
  : "http://192.168.86.240:5000"; // your computer LAN IP, mobile devices

export const GRAPHQL_URL = `${API_BASE}/graphql`;
=======
// MobileApp/lib/config.js

export const GRAPHQL_URL = __DEV__
  ? "http://192.168.86.22:4000/graphql"   // 👈 your backend (LAN IP + port)
  : "https://yourdomain.com/graphql";     // 👈 later when deployed
>>>>>>> f7baf068575c8860151771b2a2308900a812a2a2
