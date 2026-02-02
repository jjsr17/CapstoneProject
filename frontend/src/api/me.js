export async function fetchMe() {
  const token = localStorage.getItem("msAccessToken");
  if (!token) return null;

  const res = await fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query Me {
          me {
            _id
            accountType
            profileComplete
          }
        }
      `,
    }),
  });

  const json = await res.json();
  return json?.data?.me ?? null;
}
