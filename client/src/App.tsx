import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply";
import ApplicationDetail from "./pages/ApplicationDetail";
import Admin from "./pages/Admin";
import ApplicationFee from "./pages/ApplicationFee";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/apply/:jobId" component={Apply} />
      <Route path="/application/:id" component={ApplicationDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/application/:id" component={Admin} />
      <Route path="/application-fee" component={ApplicationFee} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
