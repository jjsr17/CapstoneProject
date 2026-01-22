import { Text, View, StyleSheet } from "react-native";

export default function English() {
  return (
    <View style={styles.container}>
      <Text>English (Coming Soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
