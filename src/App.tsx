import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import { SpotifyProvider, useSpotify } from "./context/SpotifyContext";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import PlaylistGrid from "./components/PlaylistGrid";
import PlaylistDetail from "./components/PlaylistDetail";
import SpotifyScript from "./components/SpotifyScript";
import routes from "tempo-routes";
import Home from "./components/home";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSpotify();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSpotify();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginScreen />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlaylistGrid />} />
        <Route path="playlist/:playlistId" element={<PlaylistDetail />} />
      </Route>
      {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <SpotifyScript />
      <SpotifyProvider>
        <AppRoutes />
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </SpotifyProvider>
    </div>
  );
}

export default App;
