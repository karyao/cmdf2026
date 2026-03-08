const configuredApiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function apiUrl(path: string) {
  if (configuredApiBase) {
    return `${configuredApiBase.replace(/\/$/, "")}${path}`;
  }

  // On web builds, relative API paths work against the current origin.
  if (typeof window !== "undefined") {
    return path;
  }

  // Native fallback for local dev with Next.js running on localhost.
  return `http://localhost:3000${path}`;
}

export const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "000000000000000000000001";
