import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import React, { useEffect, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export default function HomeScreen() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
  const loadName = async () => {
    try {
      if (Platform.OS === "web") {
        const name = localStorage.getItem("displayName");
        if (name) setUserName(name);
      } else {
        const name = await AsyncStorage.getItem("displayName");
        if (name) setUserName(name);
      }
    } catch (err) {
      console.log("Error loading name:", err);
    }
  };

  loadName();
}, []);

  
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
    justifyContent: "center",  
    padding: 20,              
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 28,         
    fontWeight: "600",
  },
  button: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 14,       
    marginBottom: 14,       
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  logoutButton: {
  },
});