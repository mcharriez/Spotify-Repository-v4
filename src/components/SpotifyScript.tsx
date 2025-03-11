import { useEffect } from "react";

interface Window {
  Spotify: any;
  onSpotifyWebPlaybackSDKReady: () => void;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default function SpotifyScript() {
  useEffect(() => {
    // Add Spotify Web Playback SDK script
    if (!document.getElementById("spotify-player")) {
      // Define the Spotify callback before adding the script
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log("Spotify Web Playback SDK Ready");
        // Dispatch a custom event that our components can listen for
        window.dispatchEvent(new Event("spotify-sdk-ready"));
      };

      const script = document.createElement("script");
      script.id = "spotify-player";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);
    }

    return () => {
      // Cleanup if needed
      const script = document.getElementById("spotify-player");
      if (script) {
        // Don't remove it to avoid re-initialization issues
        // Just clean up the callback
        window.onSpotifyWebPlaybackSDKReady = null;
      }
    };
  }, []);

  return null;
}
