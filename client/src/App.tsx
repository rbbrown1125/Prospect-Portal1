import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import Sites from "@/pages/sites";
import SiteEdit from "@/pages/site-edit";
import Templates from "@/pages/templates";
import Content from "@/pages/content";
import Analytics from "@/pages/analytics";
import Prospects from "@/pages/prospects";
import TemplatePreview from "@/pages/template-preview";
import SiteViewer from "@/pages/site-viewer";
import PublicSite from "@/pages/public-site";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import AccessCode from "@/pages/access-code";
import Onboard from "@/pages/onboard";
import VerifyEmail from "@/pages/verify-email";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
