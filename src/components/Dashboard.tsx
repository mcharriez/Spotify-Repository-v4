import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useSpotify } from "@/context/SpotifyContext";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
