import { useState, useEffect } from "react";
import { useSpotify } from "@/context/SpotifyContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function Player() {
  const { isPlaying, togglePlayPause, currentTrackUri } = useSpotify();
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  useEffect(() => {
    // Initialize player when component mounts
    if (window.Spotify) {
      const token = localStorage.getItem("spotify_token");
      if (!token) return;

      const newPlayer = new window.Spotify.Player({
        name: "Spotify Playlist Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
      });

      newPlayer.connect().then((success) => {
        if (success) {
          setPlayer(newPlayer);
        }
      });

      return () => {
        newPlayer.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (!player) return;

    // Set up listeners for player state changes
    const stateListener = ({ position, duration, track_window }: any) => {
      setProgress(position);
      setDuration(duration);
      setCurrentTrack(track_window.current_track);
    };

    player.addListener("player_state_changed", stateListener);

    // Poll for player state every second
    const interval = setInterval(() => {
      player.getCurrentState().then((state) => {
        if (state) {
          setProgress(state.position);
          setDuration(state.duration);
          setCurrentTrack(state.track_window.current_track);
        }
      });
    }, 1000);

    return () => {
      player.removeListener("player_state_changed", stateListener);
      clearInterval(interval);
    };
  }, [player]);

  const formatTime = (ms: number) => {
    if (!ms) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number[]) => {
    if (player) {
      player.seek(value[0]);
      setProgress(value[0]);
    }
  };

  const handlePrevious = () => {
    if (player) player.previousTrack();
  };

  const handleNext = () => {
    if (player) player.nextTrack();
  };

  if (!currentTrackUri) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex flex-col">
      {currentTrack && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {currentTrack.album.images && currentTrack.album.images[0] && (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.name}
                className="h-10 w-10 mr-3 rounded-sm"
              />
            )}
            <div>
              <div className="font-medium">{currentTrack.name}</div>
              <div className="text-xs text-muted-foreground">
                {currentTrack.artists.map((a) => a.name).join(", ")}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTime(progress)} / {formatTime(duration)}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <Slider
          value={[progress]}
          max={duration}
          step={1000}
          onValueChange={handleSeek}
          className="w-full"
        />

        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
