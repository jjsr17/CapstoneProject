import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Details() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Details Screen</Text>
      <Button title="HOW ARE " onPress={() => router.back()} />
    </View>
  );
}
