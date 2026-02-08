// MobileApp/app/_layout.jsx
import React from "react";
import { Stack } from "expo-router/stack";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "../lib/apolloClient";

export default function RootLayout() {
  console.log("RootLayout imports:", { Stack, ApolloProvider, apolloClient });

  return (
    <ApolloProvider client={apolloClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />

        <Stack.Screen name="classes/index" options={{ title: "Class Selection" }} />
        <Stack.Screen name="classes/mathematics" options={{ title: "Mathematics" }} />
        <Stack.Screen name="classes/science" options={{ title: "Science" }} />
        <Stack.Screen name="classes/history" options={{ title: "History" }} />
        <Stack.Screen name="classes/english" options={{ title: "English" }} />
        <Stack.Screen name="classes/computerscience" options={{ title: "Computer Science" }} />
        <Stack.Screen name="classes/electrical" options={{ title: "Electrical" }} />
        <Stack.Screen name="classes/spanish" options={{ title: "Spanish" }} />
        <Stack.Screen name="classes/architecture" options={{ title: "Architecture" }} />
        <Stack.Screen name="postlogin" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ title: "Student Account" }} />
        <Stack.Screen name="educatoraccount" options={{ title: "Educator Account" }} />
      </Stack>
    </ApolloProvider>
  );
}
