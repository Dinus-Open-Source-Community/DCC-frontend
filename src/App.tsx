import { Route, Routes, BrowserRouter as Router, Navigate } from "react-router";
import "./App.css";
import Dashboard from "./pages/dashboard/Dashboard";
import Layout from "./components/layout/Layout";
import InfectedAgents from "./pages/InfectedAgents/InfectedAgents";
import SystemLogs from "./pages/systemlogs/SystemLogs";
import Notes from "./pages/notes/Notes";
import PayloadGenerator from "./pages/generator/PayloadGenerator";
import Login from "./pages/login/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// ProtectedRoute component restricts access based on auth status
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <p className="text-green-500 font-mono tracking-widest text-sm animate-pulse">INITIALIZING SECURE CONNECTION...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children (the protected page)
  return <>{children}</>;
};

// PublicRoute redirects authenticated users away from the login page
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <p className="text-green-500 font-mono tracking-widest text-sm animate-pulse">CHECKING SECURE CONNECTION...</p>
      </div>
    );
  }

  // If already authenticated, redirect them to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Protected Layout */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Page */}
            <Route index path="/" element={<Dashboard />} />
            {/* Infected Agents Page with optional agent ID */}
            <Route path="/infected-agents" element={<InfectedAgents />} />
            <Route path="/infected-agents/:id" element={<InfectedAgents />} />
            {/* System Logs Page */}
            <Route path="/system-logs" element={<SystemLogs />} />
            {/* Notes Page */}
            <Route path="/notes" element={<Notes />} />
            {/* Payload Generator */}
            <Route path="/payload-generator" element={<PayloadGenerator />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
