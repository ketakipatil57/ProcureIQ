import { apiRequest } from "./apiClient";

function postAuth(path, payload) {
  return apiRequest(path, {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload)
  });
}

export function registerUser({ fullName, email, password }) {
  return postAuth("/auth/register", { name: fullName, email, password });
}

export function loginUser({ email, password }) {
  return postAuth("/auth/login", { email, password });
}
