import { useSpotify } from "@/context/SpotifyContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music } from "lucide-react";

export default function LoginScreen() {
  const { login } = useSpotify();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Music className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Spotify Playlist Player
          </CardTitle>
          <CardDescription>
            Connect with your Spotify account to access your playlists and play
            music.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-muted-foreground">
            This app requires Spotify Premium to use playback features.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" onClick={login}>
            Login with Spotify
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
