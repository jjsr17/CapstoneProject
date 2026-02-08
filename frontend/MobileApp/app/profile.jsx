// /app/profile.jsx
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet, Platform } from "react-native";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000";
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const userId =
        Platform.OS === "web"
          ? localStorage.getItem("mongoUserId")
          : await AsyncStorage.getItem("mongoUserId");

      if (!userId) return;

      const res = await fetch(`${API_URL}/api/users/${userId}`);
      const data = await res.json();
      setUser(data);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.name}>
        {user?.firstName} {user?.lastName}
      </Text>

      <Text>{user?.user_email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 26, marginBottom: 20, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold" },
});
