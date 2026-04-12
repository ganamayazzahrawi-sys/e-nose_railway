import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Respondents from "@/pages/respondents";
import RespondentDetail from "@/pages/respondent-detail";
import NewSession from "@/pages/new-session";
import DataExplorer from "@/pages/data-explorer";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/respondents" component={Respondents} />
        <Route path="/respondents/:id" component={RespondentDetail} />
        <Route path="/sessions/new" component={NewSession} />
        <Route path="/data" component={DataExplorer} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
