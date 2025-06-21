import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import Registry from "@/pages/registry";
import Members from "@/pages/members";
import WhatsApp from "@/pages/whatsapp";
import Temples from "@/pages/temples";
import TempleRegistry from "@/pages/temple-registry";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/registry" component={Registry} />
      <Route path="/members" component={Members} />
      <Route path="/whatsapp" component={WhatsApp} />
      <Route path="/temples" component={Temples} />
      <Route path="/temple-registry" component={TempleRegistry} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-temple-cream to-saffron-50">
          <Navigation />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
