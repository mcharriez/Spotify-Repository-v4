import { useState, useEffect } from "react";
import { useSpotify } from "@/context/SpotifyContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function PlaylistPlayer() {
  const { isPlaying, togglePlayPause, currentTrackUri } = useSpotify();
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  useEffect(() => {
    // Initialize player when component mounts
    const initPlayer = () => {
      if (typeof window !== "undefined" && window.Spotify) {
        const token = localStorage.getItem("spotify_token");
        if (!token) return;

        try {
          const newPlayer = new window.Spotify.Player({
            name: "Spotify Playlist Player",
            getOAuthToken: (cb: (token: string) => void) => {
              cb(token);
            },
            volume: 0.5,
          });

          // Add ready listener before connecting
          newPlayer.addListener(
            "ready",
            ({ device_id }: { device_id: string }) => {
              console.log("Ready with Device ID", device_id);
              localStorage.setItem("spotify_device_id", device_id);
            },
          );

          newPlayer
            .connect()
            .then((success) => {
              if (success) {
                console.log("Player connected successfully");
                setPlayer(newPlayer);
              }
            })
            .catch((err) => {
              console.error("Error connecting to Spotify player:", err);
            });

          return newPlayer;
        } catch (error) {
          console.error("Error creating Spotify player:", error);
          return null;
        }
      }
      return null;
    };

    // Try to initialize immediately if SDK is already loaded
    let playerInstance = initPlayer();

    // Set up a listener for when the SDK becomes available
    const handleSDKReady = () => {
      if (!player) {
        playerInstance = initPlayer();
      }
    };

    // Add event listener for our custom SDK ready event
    window.addEventListener("spotify-sdk-ready", handleSDKReady);

    return () => {
      window.removeEventListener("spotify-sdk-ready", handleSDKReady);
      if (playerInstance) {
        playerInstance.disconnect();
      }
    };
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
    <div className="w-full bg-card rounded-md shadow-md p-2 md:p-3">
      {currentTrack && (
        <div className="mb-2">
          <div className="font-medium text-sm truncate">
            {currentTrack.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {currentTrack.artists.map((a) => a.name).join(", ")}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <Slider
          value={[progress]}
          max={duration}
          step={1000}
          onValueChange={handleSeek}
          className="w-full"
        />

        <div className="flex items-center justify-between mt-1 md:mt-2">
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
            className="h-9 w-9 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
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
