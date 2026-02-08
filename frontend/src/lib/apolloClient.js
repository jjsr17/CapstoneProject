import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GRAPHQL_URL } from "./config";

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem("msAccessToken");
  const useMs = (await AsyncStorage.getItem("useMsSso")) === "true";

  return {
    headers: {
      ...headers,
      ...(useMs && token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
