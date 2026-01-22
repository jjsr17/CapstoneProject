// /app/home.jsx

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  const userName = "User"; // placeholder

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {userName}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/profile")}
      >
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes")}
      >
        <Text style={styles.buttonText}>Browse Classes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "600",
  },
  button: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 18,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 30,
  },
});
