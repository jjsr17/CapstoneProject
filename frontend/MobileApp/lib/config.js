// MobileApp/lib/config.js

export const GRAPHQL_URL = __DEV__
  ? "http://192.168.86.22:4000/graphql"   // 👈 your backend (LAN IP + port)
  : "https://yourdomain.com/graphql";     // 👈 later when deployed
