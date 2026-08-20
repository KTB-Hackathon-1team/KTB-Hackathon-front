import { publicRequest, refreshSession } from "./apiClient";

export { ApiError } from "./apiClient";

export function loginRequest(loginId, password) {
  return publicRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });
}

export function signupRequest(loginId, password, nickname) {
  return publicRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ loginId, password, nickname }),
  });
}

export const refreshAccessToken = refreshSession;

export function logoutRequest() {
  return publicRequest("/api/auth/logout", { method: "POST" });
}
