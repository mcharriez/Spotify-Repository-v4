import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAuthUrl,
  getTokenFromUrl,
  saveToken,
  getToken,
  clearToken,
  isTokenValid,
  getUserProfile,
  initializePlayer,
  pausePlayback,
  resumePlayback,
  getPlaybackState,
} from "../lib/spotify";
import { SpotifyUser } from "../types/spotify";

interface SpotifyContextType {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  isLoading: boolean;
  isPlaying: boolean;
  currentTrackUri: string | null;
  login: () => void;
  logout: () => void;
  playTrack: (uri: string) => Promise<void>;
  togglePlayPause: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);

  // Initialize Spotify player when SDK is ready
  useEffect(() => {
    const initSpotifyPlayer = async () => {
      if (isAuthenticated && typeof window !== "undefined" && window.Spotify) {
        try {
          const spotifyPlayer = await initializePlayer();
          setPlayer(spotifyPlayer);
        } catch (error) {
          console.error("Failed to initialize Spotify player:", error);
        }
      }
    };

    // Listen for our custom event when SDK is ready
    const handleSDKReady = () => {
      initSpotifyPlayer();
    };

    window.addEventListener("spotify-sdk-ready", handleSDKReady);

    // Try to initialize immediately if SDK is already loaded
    if (window.Spotify) {
      initSpotifyPlayer();
    }

    return () => {
      window.removeEventListener("spotify-sdk-ready", handleSDKReady);
    };
  }, [isAuthenticated]);

  // Check for token on initial load and URL hash changes
  useEffect(() => {
    const checkToken = async () => {
      setIsLoading(true);
      console.log("Checking for token...");

      // Check if we have a token in the URL (after redirect)
      const tokenFromUrl = getTokenFromUrl();
      if (tokenFromUrl) {
        console.log("Token found in URL, saving...");
        saveToken(tokenFromUrl);
        // Clear the URL hash to avoid exposing the token
        window.location.hash = "";
      }

      // Check if we have a valid token in localStorage
      if (isTokenValid()) {
        console.log("Valid token found in localStorage");
        setIsAuthenticated(true);
        try {
          const userData = await getUserProfile();
          console.log("User profile fetched:", userData);
          setUser(userData);

          // Player will be initialized in the separate useEffect when SDK is ready
        } catch (error) {
          console.error("Failed to get user profile:", error);
          clearToken();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log("No valid token found");
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkToken();

    // Player cleanup on unmount
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  // Update playback state periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkPlaybackState = async () => {
      try {
        const state = await getPlaybackState();
        if (state && state.item) {
          setIsPlaying(state.is_playing);
          setCurrentTrackUri(state.item.uri);
        }
      } catch (error) {
        // Silent fail - might just be no active playback
        console.debug("No active playback state");
      }
    };

    // Initial check
    checkPlaybackState();

    const interval = setInterval(checkPlaybackState, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = () => {
    console.log("Initiating Spotify login...");
    const authUrl = getAuthUrl();
    console.log("Redirecting to:", authUrl);
    window.location.href = authUrl;
  };

  const logout = () => {
    if (player) {
      player.disconnect();
      setPlayer(null);
    }
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
    setIsPlaying(false);
    setCurrentTrackUri(null);
  };

  const playTrack = async (uri: string) => {
    try {
      // Import and use the playTrack function directly
      const { playTrack: playTrackFn } = await import("../lib/spotify");
      await playTrackFn(uri);
      setIsPlaying(true);
      setCurrentTrackUri(uri);
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        await pausePlayback();
        setIsPlaying(false);
      } else if (currentTrackUri) {
        await resumePlayback();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to toggle play/pause:", error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    isPlaying,
    currentTrackUri,
    login,
    logout,
    playTrack,
    togglePlayPause,
  };

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
};
