const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("msAccessToken");
  const useMs = localStorage.getItem("useMsSso") === "true";

  return {
    headers: {
      ...headers,
      Authorization: useMs && token ? `Bearer ${token}` : "",
    },
  };
});
