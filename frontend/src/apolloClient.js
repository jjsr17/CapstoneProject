import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL, // or hardcode your URL
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("msAccessToken");
  const useMs = localStorage.getItem("useMsSso") === "true";

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
