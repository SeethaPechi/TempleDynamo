import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Registry from "@/pages/registry";
import Members from "@/pages/members";
import WhatsApp from "./pages/whatsapp";
import Temples from "./pages/temples";
import TempleRegistry from "./pages/temple-registry";
import TempleMembers from "./pages/temple-members";
import TempleDetails from "./pages/temple-details";
import FamilyTree from "./pages/family-tree";
import MemberDetails from "./pages/member-details";
import RegisterPage from "./pages/register";
import SignInPage from "./pages/signin";
import NotFound from "./pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/register" component={RegisterPage} />
      <Route path="/signin" component={SignInPage} />
      
      {/* Home page - accessible to everyone */}
      <Route path="/" component={Home} />
      
      {/* Protected routes - require authentication */}
      {isAuthenticated ? (
        <>
          <Route path="/family-registry" component={Registry} />
          <Route path="/members" component={Members} />
          <Route path="/whatsapp" component={WhatsApp} />
          <Route path="/temples" component={Temples} />
          <Route path="/temple/:id" component={TempleDetails} />
          <Route path="/temple-registry" component={TempleRegistry} />
          <Route path="/temple-members" component={TempleMembers} />
          <Route path="/family-tree" component={FamilyTree} />
          <Route path="/member/:id" component={MemberDetails} />
          <Route path="/member-details/:id" component={MemberDetails} />
        </>
      ) : (
        <Route>
          {() => (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-saffron-50 to-temple-gold/20">
              <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <h2 className="text-2xl font-bold text-temple-brown mb-4">Authentication Required</h2>
                <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
                <div className="space-x-4">
                  <a href="/signin" className="inline-flex items-center px-4 py-2 bg-saffron-500 text-white rounded-lg hover:bg-saffron-600 transition-colors">
                    Sign In
                  </a>
                  <a href="/register" className="inline-flex items-center px-4 py-2 border border-saffron-500 text-saffron-500 rounded-lg hover:bg-saffron-50 transition-colors">
                    Create Account
                  </a>
                </div>
              </div>
            </div>
          )}
        </Route>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 mobile-scroll-fix">
      <Navigation />
      <Router />
      <Toaster />
    </div>
  );
}

function App() {
  // Optimized cache management - minimal clearing for better performance
  useEffect(() => {
    // Only invalidate queries on app mount, don't clear entire cache
    queryClient.invalidateQueries();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;