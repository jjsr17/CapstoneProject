import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function ClassesScreen() {
  const userName = "User";

  return (
    <ScrollView contentConstainerStyle={styles.container}>
      <Text style={styles.title}>Welcome {userName}</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/architecture")}>
        <Text style={styles.buttonText}>Architecture</Text>
        <Text style={styles.buttonSubtitle}>Design . History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/computerscience")}>
        <Text style={styles.buttonText}>Computer Science</Text>
        <Text style={styles.buttonSubtitle}>Programming . Algorithms</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/electrical")}>
        <Text style={styles.buttonText}>Electrical</Text>
        <Text style={styles.buttonSubtitle}>Circuits . Power . Electronics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/english")}>
        <Text style={styles.buttonText}>English</Text>
        <Text style={styles.buttonSubtitle}>Writing . Literature . Grammar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/history")}>
        <Text style={styles.buttonText}>History</Text>
        <Text style={styles.buttonSubtitle}>World . US History . etc. </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/mathematics")}>
        <Text style={styles.buttonText}>Mathematics</Text>
        <Text style={styles.buttonSubtitle}>Algebra . Calculus . Statistics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/science")}>
        <Text style={styles.buttonText}>Science</Text>
        <Text style={styles.buttonSubtitle}> Biology. Chemistry . Physics</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/classes/spanish")}>
        <Text style={styles.buttonText}>Spanish</Text>
        <Text style={styles.buttonSubtitle}>Writing . Literature . Grammar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2000,
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
},
});
