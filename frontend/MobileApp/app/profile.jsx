// /app/profile.jsx

import { View, Text, StyleSheet } from "react-native";

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.item}>Name: Jamcha El Putipuerko</Text>
      <Text style={styles.item}>Date of Birth: 01/01/2000</Text>
      <Text style={styles.item}>Email: john.doe@email.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    fontWeight: "bold",
  },
  item: {
    fontSize: 18,
    marginBottom: 12,
  },
});
