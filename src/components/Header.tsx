import { useSpotify } from "@/context/SpotifyContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Pause, Music, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreatePlaylistDialog from "./CreatePlaylistDialog";
import NotificationsDialog from "./NotificationsDialog";

export default function Header() {
  const { user, logout, isPlaying, togglePlayPause, currentTrackUri } =
    useSpotify();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 md:h-16 px-3 md:px-4">
        <div className="flex items-center gap-1 md:gap-2">
          <Music className="h-5 w-5 md:h-6 md:w-6" />
          <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:inline">
            Spotify Playlist Player
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationsDialog />
          <CreatePlaylistDialog />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.images?.[0]?.url}
                    alt={user.display_name}
                  />
                  <AvatarFallback>
                    {user.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.display_name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
