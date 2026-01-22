import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";


export default function BrowseClasses() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Class Selection</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/mathematics")}
      >
        <Text style={styles.buttonText}>Mathematics</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/science")}
      >
        <Text style={styles.buttonText}>Science</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/history")}
      >
        <Text style={styles.buttonText}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/english")}
      >
        <Text style={styles.buttonText}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/computerscience")}
      >
        <Text style={styles.buttonText}>Computer Science</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/electrical")}
      >
        <Text style={styles.buttonText}>Electrical</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/spanish")}
      >
        <Text style={styles.buttonText}>Spanish</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/classes/architecture")}
      >
        <Text style={styles.buttonText}>Architecture</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  button: {
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
  },
});

