import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function ComputerScience() {
  const userName = "User";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Computer Science</Text>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Programming</Text>
  <Text style={styles.buttonSubtitle}>Foundations of coding</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6984d007f5d360c03cfd77fd",},})}>
  <Text style={styles.buttonTitle}>Algorithm</Text>
  <Text style={styles.buttonSubtitle}>Process or set of rules to be followed in calculation or other problem solving operations</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6984d007f5d360c03cfd77fd",},})}>
  <Text style={styles.buttonTitle}>Data Structures</Text>
  <Text style={styles.buttonSubtitle}>Methods of organizing, storing and accessing data efficiently in a computer</Text>
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
   courseCard: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 14,
    marginBottom: 15,
    alignItems: "center"
    },
});

