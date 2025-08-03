import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/hooks/useAuth";
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
import NotFound from "./pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Home page is accessible to everyone, but shows login form if not authenticated */}
      <Route path="/" component={Home} />
      
      {/* Login route for explicit access to login form */}
      <Route path="/login" component={LoginForm} />
      
      {/* Protected routes that require authentication */}
      <Route path="/registry">
        <ProtectedRoute>
          <Registry />
        </ProtectedRoute>
      </Route>
      
      <Route path="/members">
        <ProtectedRoute>
          <Members />
        </ProtectedRoute>
      </Route>
      
      <Route path="/whatsapp">
        <ProtectedRoute>
          <WhatsApp />
        </ProtectedRoute>
      </Route>
      
      <Route path="/temples">
        <ProtectedRoute>
          <Temples />
        </ProtectedRoute>
      </Route>
      
      <Route path="/temple/:id">
        <ProtectedRoute>
          <TempleDetails />
        </ProtectedRoute>
      </Route>
      
      <Route path="/temple-registry">
        <ProtectedRoute>
          <TempleRegistry />
        </ProtectedRoute>
      </Route>
      
      <Route path="/temple-members">
        <ProtectedRoute>
          <TempleMembers />
        </ProtectedRoute>
      </Route>
      
      <Route path="/family-tree">
        <ProtectedRoute>
          <FamilyTree />
        </ProtectedRoute>
      </Route>
      
      <Route path="/member/:id">
        <ProtectedRoute>
          <MemberDetails />
        </ProtectedRoute>
      </Route>
      
      <Route path="/member-details/:id">
        <ProtectedRoute>
          <MemberDetails />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
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
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50 mobile-scroll-fix">
          <Navigation />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;