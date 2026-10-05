const ACCESS_TOKEN_KEY = "procureiq_access_token";

function getApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!baseUrl) {
    const error = new Error("The ProcureIQ API is not configured.");
    error.code = "AUTH_API_NOT_CONFIGURED";
    throw error;
  }

  return baseUrl.replace(/\/+$/, "");
}

export function getStoredAccessToken() {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
  if (!token) return null;

  const parts = token.split(".");
  return parts.length === 3 && parts.every(Boolean) ? token : null;
}

export function hasUsableAccessToken() {
  return Boolean(getStoredAccessToken());
}

function getErrorMessage(status) {
  if (status === 400) return "The search request failed validation. Please revise your query and try again.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 413) return "The submitted file or request is too large.";
  if (status === 502) return "The ProcureIQ service is temporarily unavailable. Please try again.";
  if (status >= 500) return "The ProcureIQ service encountered a problem. Please try again later.";
  return "The request could not be completed. Please try again.";
}

export async function apiRequest(path, options = {}) {
  const { auth = true, headers: suppliedHeaders = {}, body, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);

  if (body !== undefined && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestOptions,
      headers,
      body
    });
  } catch {
    const error = new Error("Unable to reach the ProcureIQ service. Check your connection and try again.");
    error.code = "API_NETWORK_ERROR";
    throw error;
  }

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        const error = new Error("The ProcureIQ service returned an unreadable response.");
        error.code = "API_INVALID_RESPONSE";
        throw error;
      }
    }
  }

  if (!response.ok) {
    const error = new Error(getErrorMessage(response.status));
    error.status = response.status;
    error.code = `API_HTTP_${response.status}`;
    throw error;
  }

  return data;
}
