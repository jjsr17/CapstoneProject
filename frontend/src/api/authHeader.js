export function getAuthHeaders() {
  const token = localStorage.getItem("msAccessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
