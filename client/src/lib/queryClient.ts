import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0,
      gcTime: 0, // Updated from cacheTime to gcTime for React Query v5
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Clear cache on page refresh and visibility changes
if (typeof window !== 'undefined') {
  // Clear cache when page becomes visible (after refresh or tab switch)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      queryClient.clear();
    }
  });

  // Clear cache on page load
  window.addEventListener('load', () => {
    queryClient.clear();
  });

  // Clear cache before page unload
  window.addEventListener('beforeunload', () => {
    queryClient.clear();
  });
}
