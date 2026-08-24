export function getTokenPayload() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    return JSON.parse(
      atob(payload)
    );
  } catch {
    return null;
  }
}

export function getUserRole() {
  const payload = getTokenPayload();

  return payload?.role ?? null;
}
