import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Spanish() {
  const userName = "User";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spanish</Text>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Writing</Text>
  <Text style={styles.buttonSubtitle}>Learning to write from a beginner level to an advanced level</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Literature</Text>
  <Text style={styles.buttonSubtitle}>Books, subtle messages, reading comprehension and more</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Grammar</Text>
  <Text style={styles.buttonSubtitle}>Improving how you form words, sentences and more</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>More to be added soon...</Text>
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
    marginBottom: 30,
    fontWeight: "600",
  },
  button: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 14,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  buttonTitle: {
  fontSize: 18,
  fontWeight: "600",
},

buttonSubtitle: {
  fontSize: 13,
  color: "#555",
  marginTop: 4,
  textAlign: "center",
  width: "75%",
},
});

