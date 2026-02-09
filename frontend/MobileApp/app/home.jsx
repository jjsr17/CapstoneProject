import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
console.log("HOME SCREEN LOADED");

export default function HomeScreen() {
  const userName = "User";
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome {userName}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/postlogin")}
      >
        <Text style={styles.buttonText}>Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes")}

      >
        <Text style={styles.buttonText}>Browse Classes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
        <Text style={styles.buttonText}>Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={async () => {
          if (Platform.OS === "web") {
            localStorage.removeItem("mongoUserId");
            localStorage.removeItem("accountType");
          } else {
            await AsyncStorage.multiRemove(["mongoUserId", "accountType"]);
          }
          router.replace("/auth/login");
        }}
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
