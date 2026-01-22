// MobileApp/lib/apolloClient.js
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Platform } from "react-native";

// ✅ IMPORTANT: device cannot use localhost
const API_WEB = "http://localhost:5000/graphql";
const API_DEVICE = "http://192.168.86.240:5000/graphql"; // <-- your LAN IP
const GRAPHQL_URL = Platform.OS === "web" ? API_WEB : API_DEVICE;

// If you later store tokens, inject them here.
// For now you can return empty headers.
const authLink = setContext(async (_, { headers }) => {
  // Example later:
  // const token = await SecureStore.getItemAsync("idToken");
  // return { headers: { ...headers, Authorization: token ? `Bearer ${token}` : "" } };

  return { headers: { ...headers } };
});

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
