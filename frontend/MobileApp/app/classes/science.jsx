import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function Science() {
  const userName = "User";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Science</Text>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "69701b54e6255592e1ac7435",},})}>
  <Text style={styles.buttonTitle}>Biology</Text>
  <Text style={styles.buttonSubtitle}>Study of life and living organisms</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Chemistry</Text>
  <Text style={styles.buttonSubtitle}>Study of compositions, strucutre, properties and behaviors of matter</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6983d11f7c449e05409e6b81",},})}>
  <Text style={styles.buttonTitle}>Thermochemistry</Text>
  <Text style={styles.buttonSubtitle}>This is a basic course description</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>Physics</Text>
  <Text style={styles.buttonSubtitle}>Fundamental science for studying matter, energy, motion and the forces of nature</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6984d007f5d360c03cfd77fd",},})}>
  <Text style={styles.buttonTitle}>Quantum Mechanics</Text>
  <Text style={styles.buttonSubtitle}>Fundamental physical theory describing the behavior of matter and light at the atomic and subatomic scale</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6984d007f5d360c03cfd77fd",},})}>
  <Text style={styles.buttonTitle}>Thermodyanmics</Text>
  <Text style={styles.buttonSubtitle}>Branch of physics and chemistry concered with the relationships between heat, work, temperature and energy</Text>
  </TouchableOpacity>

  <TouchableOpacity style={[styles.button, styles.disabledButton]} activeOpacity={1}>
  <Text style={styles.buttonTitle}>More to be added soon...</Text>
  </TouchableOpacity>
  
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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

