import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

// Admin pages
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Create from "@/pages/create";
import Clients from "@/pages/clients";
import Team from "@/pages/team";
import Videos from "@/pages/videos";
import Calendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import Layout from "@/components/layout";

// Team member (editor) pages
import EditorDashboard from "@/pages/editor-dashboard";
import EditorProjects from "@/pages/editor-projects";
import EditorNotifications from "@/pages/editor-notifications";
import EditorProfile from "@/pages/editor-profile";
import EditorLayout from "@/components/editor-layout";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10000 } },
});

function AdminRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if ((user as any).role === "editor") return <Redirect to="/editor" />;
  return <Layout><Component /></Layout>;
}

function EditorRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoaded } = useAuth();
  if (!isLoaded) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if ((user as any).role !== "editor") return <Redirect to="/" />;
  return <EditorLayout><Component /></EditorLayout>;
}

function Spinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#0d3f7a", borderTopColor: "transparent" }} />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      {/* Admin routes */}
      <Route path="/" component={() => <AdminRoute component={Dashboard} />} />
      <Route path="/create" component={() => <AdminRoute component={Create} />} />
      <Route path="/projects" component={() => <AdminRoute component={Projects} />} />
      <Route path="/clients" component={() => <AdminRoute component={Clients} />} />
      <Route path="/team" component={() => <AdminRoute component={Team} />} />
      <Route path="/videos" component={() => <AdminRoute component={Videos} />} />
      <Route path="/calendar" component={() => <AdminRoute component={Calendar} />} />
      <Route path="/settings" component={() => <AdminRoute component={Settings} />} />

      {/* Team member routes */}
      <Route path="/editor" component={() => <EditorRoute component={EditorDashboard} />} />
      <Route path="/editor/projects" component={() => <EditorRoute component={EditorProjects} />} />
      <Route path="/editor/notifications" component={() => <EditorRoute component={EditorNotifications} />} />
      <Route path="/editor/profile" component={() => <EditorRoute component={EditorProfile} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
