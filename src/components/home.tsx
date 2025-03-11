import { useSpotify } from "@/context/SpotifyContext";
import LoginScreen from "./LoginScreen";
import Dashboard from "./Dashboard";
import PlaylistGrid from "./PlaylistGrid";

function Home() {
  const { isAuthenticated, isLoading } = useSpotify();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Dashboard>
      <PlaylistGrid />
    </Dashboard>
  );
}

export default Home;
