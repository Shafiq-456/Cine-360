export const API_BASE = "/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("cine360_token") || localStorage.getItem("t");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(API_BASE + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = typeof data.detail === "string" 
      ? data.detail 
      : (data.message || "An error occurred while communicating with the server");
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getCurrentUser() {
  const token = localStorage.getItem("cine360_token") || localStorage.getItem("t");
  const name = localStorage.getItem("cine360_name") || localStorage.getItem("name");
  const role = localStorage.getItem("cine360_role") || "user";
  const email = localStorage.getItem("cine360_email") || "";
  if (!token) return null;
  return { token, name: name || "User", role, email };
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem("cine360_token", user.token);
    localStorage.setItem("t", user.token);
    localStorage.setItem("cine360_name", user.name);
    localStorage.setItem("name", user.name);
    localStorage.setItem("cine360_role", user.role);
    localStorage.setItem("cine360_email", user.email || "");
  } else {
    localStorage.removeItem("cine360_token");
    localStorage.removeItem("t");
    localStorage.removeItem("cine360_name");
    localStorage.removeItem("name");
    localStorage.removeItem("cine360_role");
    localStorage.removeItem("cine360_email");
  }
  window.dispatchEvent(new Event("cine360_auth_change"));
}

export function getSelectedCity() {
  return localStorage.getItem("cine360_city") || "Chennai";
}

export function setSelectedCity(city) {
  localStorage.setItem("cine360_city", city);
  window.dispatchEvent(new Event("cine360_city_change"));
}
