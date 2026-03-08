const configuredApiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function apiUrl(path: string) {
  const base = configuredApiBase || "http://localhost:3000";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}

export const DEMO_USER_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID ?? "000000000000000000000001";
