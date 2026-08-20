import returnFetch from "return-fetch";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

let accessToken = null;
let refreshPromise = null;
const sessionListeners = new Set();

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function notifySession(session) {
  sessionListeners.forEach((listener) => listener(session));
}

export function setApiSession(session) {
  accessToken = session?.accessToken ?? null;
  notifySession(session ?? null);
}

export function clearApiSession() {
  accessToken = null;
  notifySession(null);
}

export function subscribeApiSession(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

const fetchExtended = returnFetch({
  baseUrl: API_BASE_URL,
  headers: { Accept: "application/json" },
  interceptors: {
    request: async ([input, init]) => {
      const headers = new Headers(init?.headers);

      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      return [input, { ...init, headers, credentials: "include" }];
    },
  },
});

async function execute(path, init = {}) {
  let response;
  try {
    response = await fetchExtended(path, init);
  } catch {
    throw new ApiError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", 0);
  }

  const result = await response.json().catch(() => ({
    message: "서버 응답을 처리할 수 없습니다.",
    data: null,
  }));

  if (!response.ok) {
    throw new ApiError(result.message || "요청 처리에 실패했습니다.", response.status);
  }
  return result.data;
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = execute("/api/auth/refresh", { method: "POST" })
      .then((session) => {
        setApiSession(session);
        return session;
      })
      .catch((error) => {
        clearApiSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function publicRequest(path, init = {}) {
  return execute(path, init);
}

export async function apiRequest(path, init = {}) {
  try {
    return await execute(path, init);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || path.startsWith("/api/auth/")) {
      throw error;
    }
    await refreshSession();
    return execute(path, init);
  }
}

export const swrFetcher = (key) => apiRequest(key);
