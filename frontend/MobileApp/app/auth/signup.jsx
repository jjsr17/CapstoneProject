// app/auth/signup.jsx
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, Platform } from "react-native";
import { router } from "expo-router";

const API_WEB = "http://localhost:5000";
const API_DEVICE = "http://192.168.86.240:5000"; // your LAN IP
const API_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const signup = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          accountType: "student", // or educator
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        Alert.alert("Signup failed", data.message || "Error");
        return;
      }

      Alert.alert("Success", "Account created");
      router.replace("/auth/login");
    } catch (e) {
      Alert.alert("Network error", String(e));
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Signup</Text>
      <TextInput placeholder="First Name" onChangeText={setFirstName} />
      <TextInput placeholder="Last Name" onChangeText={setLastName} />
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Create Account" onPress={signup} />
    </View>
  );
}
