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
): Promise<any> {
  const requestBody = data ? JSON.stringify(data) : undefined;
  console.log(`API Request: ${method} ${url} - Payload size: ${requestBody?.length || 0} bytes`);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: requestBody,
    credentials: "include",
  });

  console.log(`API Response: ${res.status} ${res.statusText}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error Response:", errorText);
    let errorMessage = `Request failed: ${res.status} ${res.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      if (errorData.details) {
        errorMessage += ` - ${errorData.details.join(', ')}`;
      }
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }
    
    throw new Error(errorMessage);
  }

  const result = await res.json();
  console.log("API Success Response received");
  return result;
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
      refetchOnWindowFocus: false, // Disable automatic refetch on focus
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
      retry: 1, // Allow 1 retry for failed requests
    },
    mutations: {
      retry: false,
    },
  },
});

// Optimized cache management - only clear on actual page refresh
if (typeof window !== 'undefined') {
  // Only clear cache on actual page reload, not tab switches
  window.addEventListener('beforeunload', () => {
    // Only clear if user is actually leaving the page
    if (performance.navigation?.type === 1) {
      queryClient.clear();
    }
  });
}
