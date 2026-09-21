import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  const baseUrl = getApiBaseUrl();
  const trpcUrl = `${baseUrl}/api/trpc`;

  // Helpful log in development / first launch of APK
  if (__DEV__ || !baseUrl.includes("manus.computer")) {
    console.log("[tRPC] API base URL:", baseUrl);
  }

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const token = await Auth.getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch with timeout + credentials
        fetch(url, options) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
            credentials: "include",
          }).finally(() => clearTimeout(timeoutId));
        },
      }),
    ],
  });
}
