import { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/useAuth";
import { LoginForm } from "./LoginForm";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, shouldRedirect } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirect) {
    return fallback || <LoginForm />;
  }

  return <>{children}</>;
}