function getAuthApiUrl(path) {
  const baseUrl = import.meta.env.VITE_AUTH_API_URL?.trim();
  if (!baseUrl) {
    const error = new Error("Authentication is not connected yet. Your information has not been submitted.");
    error.code = "AUTH_API_NOT_CONFIGURED";
    throw error;
  }

  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

async function postAuth(path, payload) {
  const response = await fetch(getAuthApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("The authentication service returned an unreadable response.");
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || "Authentication request failed.");
  }
  return data;
}

export function registerUser({ fullName, email, organization, password }) {
  return postAuth("/auth/register", { fullName, email, organization, password });
}

export function loginUser({ email, password }) {
  return postAuth("/auth/login", { email, password });
}
