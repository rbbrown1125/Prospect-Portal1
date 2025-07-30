import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

// Critical routes loaded immediately
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

// Lazy load non-critical routes for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Sites = lazy(() => import("@/pages/sites"));
const SiteEdit = lazy(() => import("@/pages/site-edit"));
const Templates = lazy(() => import("@/pages/templates"));
const Content = lazy(() => import("@/pages/content"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Prospects = lazy(() => import("@/pages/prospects"));
const TemplatePreview = lazy(() => import("@/pages/template-preview"));
const SiteViewer = lazy(() => import("@/pages/site-viewer"));
const PublicSite = lazy(() => import("@/pages/public-site"));
const Profile = lazy(() => import("@/pages/profile"));
const Admin = lazy(() => import("@/pages/admin"));
const AccessCode = lazy(() => import("@/pages/access-code"));
const Onboard = lazy(() => import("@/pages/onboard"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));

// Loading component for suspense fallback
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Preload critical routes after initial render
  useEffect(() => {
    if (isAuthenticated) {
      // Preload dashboard and sites as they're commonly accessed
      import("@/pages/dashboard");
      import("@/pages/sites");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <RouteLoading />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoading />}>
        <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Auth} />
          <Route path="/preview/template/:id" component={TemplatePreview} />
          <Route path="/site/:id" component={PublicSite} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/sites" component={Sites} />
          <Route path="/sites/:id" component={SiteViewer} />
          <Route path="/sites/:id/edit" component={SiteEdit} />
          <Route path="/templates" component={Templates} />
          <Route path="/content" component={Content} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/prospects" component={Prospects} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={Admin} />
          <Route path="/access-code" component={AccessCode} />
          <Route path="/onboard/:accessCode" component={Onboard} />
          <Route path="/verify-email/:token" component={VerifyEmail} />
          <Route path="/preview/template/:id" component={TemplatePreview} />
          <Route path="/site/:id" component={PublicSite} />
        </>
      )}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
