import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  const userName = "User";
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {userName}</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/postlogin")}>
        <Text style={styles.buttonText}>Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/search")}>
      <Text style={styles.buttonText}>Browse Courses</Text>
        </TouchableOpacity>
  

      <TouchableOpacity style={styles.button} onPress={() => router.push("/messages")}>
        <Text style={styles.buttonText}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={() => router.replace("/auth/login")}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",   // ✅ same as before
    padding: 20,               // 👈 was 30 (slightly smaller so it fits)
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 28,          // 👈 was 40
    fontWeight: "600",
  },
  button: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 14,       // 👈 was 18
    marginBottom: 14,          // 👈 was 20
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 18,             // 👈 was 30
  },
});
