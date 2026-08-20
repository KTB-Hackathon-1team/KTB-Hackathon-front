export function protectedRouteState(user, isRestoring) {
  if (isRestoring) return "loading";
  return user ? "outlet" : "login";
}

export function sessionCacheKey(user) {
  if (!user) return "anonymous";
  return `user:${user.id ?? user.loginId ?? JSON.stringify(user)}`;
}
