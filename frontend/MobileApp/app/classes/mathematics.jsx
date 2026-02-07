import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScrollView } from "react-native";

export default function Mathematics() {
  const userName = "User";

  return (
  
  <ScrollView contentContainerStyle={styles.container}>
  <Text style={styles.title}>Mathematics</Text>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "697acde12c3fe4fc8ec729c4",},})}>
  <Text style={styles.buttonTitle}>Algebra</Text>
  <Text style={styles.buttonSubtitle}>Basic mathematical functions</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "69752b81236c08f3ed422224",},})}>
  <Text style={styles.buttonTitle}>Calculus</Text>
  <Text style={styles.buttonSubtitle}>More advanced level of math</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "6978298ce7e635ba32f862fd",},})}>
  <Text style={styles.buttonTitle}>Calculus 2</Text>
  <Text style={styles.buttonSubtitle}>Specializes in shapes, angles and finding values within them</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "697fdd5cd92301fe54183bf4",},})}>
  <Text style={styles.buttonTitle}>Linear Algebra</Text>
  <Text style={styles.buttonSubtitle}>This is a test for linear algebra</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "697fdd5cd92301fe54183bf4",},})}>
  <Text style={styles.buttonTitle}>Abstract Algebra</Text>
  <Text style={styles.buttonSubtitle}>This is a test for abstract algebra</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "69815d6eb2605bb13674d1e0",},})}>
  <Text style={styles.buttonTitle}>Projective Geometry</Text>
  <Text style={styles.buttonSubtitle}>This is a description about Projective Geometry</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.courseCard} onPress={() => router.push({pathname: "/booking", params: {courseId: "69838cc6fd87850720cc472f",},})}>
  <Text style={styles.buttonTitle}>Differential Equations</Text>
  <Text style={styles.buttonSubtitle}>Testing descriptiopn for partial differential equations</Text>
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
    courseCard: {
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 14,
    marginBottom: 15,
    alignItems: "center"
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

