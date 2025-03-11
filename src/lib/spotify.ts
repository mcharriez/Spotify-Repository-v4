// Spotify API configuration
const CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID || "67a024a87eb547cda08c5aae70243013";
// Make sure the redirect URI exactly matches what's registered in Spotify Developer Dashboard
const REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ||
  "https://objective-lewin5-nc679.dev.tempolabs.ai";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-library-read",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
];

// Generate the Spotify authorization URL
export const getAuthUrl = () => {
  // Make sure the redirect URI doesn't have a trailing slash if it's not supposed to
  const cleanRedirectUri = REDIRECT_URI.endsWith("/")
    ? REDIRECT_URI
    : `${REDIRECT_URI}`;
  console.log(
    "Auth URL:",
    `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${cleanRedirectUri}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join("%20")}`,
  );
  return `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${cleanRedirectUri}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join("%20")}`;
};

// Get access token from URL after redirect
export const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;

  const stringAfterHash = hash.substring(1);
  const paramsInUrl = stringAfterHash.split("&");
  const paramsSplit = paramsInUrl.reduce(
    (acc: Record<string, string>, currentValue) => {
      const [key, value] = currentValue.split("=");
      acc[key] = value;
      return acc;
    },
    {},
  );

  return paramsSplit.access_token || null;
};

// Save token to localStorage
export const saveToken = (token: string) => {
  localStorage.setItem("spotify_token", token);
  localStorage.setItem("spotify_token_timestamp", Date.now().toString());
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem("spotify_token");
};

// Clear token from localStorage
export const clearToken = () => {
  localStorage.removeItem("spotify_token");
  localStorage.removeItem("spotify_token_timestamp");
};

// Check if token is valid (not expired)
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const timestamp = localStorage.getItem("spotify_token_timestamp");
  if (!timestamp) return false;

  // Spotify tokens expire after 1 hour (3600000 ms)
  const now = Date.now();
  const tokenAge = now - parseInt(timestamp);
  return tokenAge < 3600000;
};

// Spotify API fetch wrapper
export const spotifyFetch = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const token = getToken();
  if (!token) throw new Error("No token available");

  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired
      clearToken();
      window.location.href = "/";
      throw new Error("Token expired");
    }
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
};

// Get user profile
export const getUserProfile = () => spotifyFetch("/me");

// Get user's playlists
export const getUserPlaylists = () => spotifyFetch("/me/playlists");

// Get playlist details
export const getPlaylistDetails = (playlistId: string) =>
  spotifyFetch(`/playlists/${playlistId}`);

// Initialize Spotify Web Playback SDK
export const initializePlayer = (): Promise<Spotify.Player> => {
  return new Promise((resolve, reject) => {
    if (!window.Spotify) {
      reject(new Error("Spotify Web Playback SDK not loaded"));
      return;
    }

    const token = getToken();
    if (!token) {
      reject(new Error("No token available"));
      return;
    }

    const player = new window.Spotify.Player({
      name: "Spotify Playlist Player",
      getOAuthToken: (cb: (token: string) => void) => {
        cb(token);
      },
      volume: 0.5,
    });

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      console.log("Ready with Device ID", device_id);
      localStorage.setItem("spotify_device_id", device_id);
      resolve(player);
    });

    player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
      console.log("Device ID has gone offline", device_id);
    });

    player.addListener(
      "initialization_error",
      ({ message }: { message: string }) => {
        console.error("Initialization error:", message);
        reject(new Error(message));
      },
    );

    player.addListener(
      "authentication_error",
      ({ message }: { message: string }) => {
        console.error("Authentication error:", message);
        clearToken();
        reject(new Error(message));
      },
    );

    player.addListener("account_error", ({ message }: { message: string }) => {
      console.error("Account error:", message);
      reject(new Error(message));
    });

    player.connect();
  });
};

// Play a track
export const playTrack = async (uri: string) => {
  const deviceId = localStorage.getItem("spotify_device_id");
  if (!deviceId) {
    console.warn("No device ID available, trying to play without device ID");
    return spotifyFetch(`/me/player/play`, {
      method: "PUT",
      body: JSON.stringify({ uris: [uri] }),
    });
  }

  return spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri] }),
  });
};

// Pause playback
export const pausePlayback = () => {
  return spotifyFetch("/me/player/pause", { method: "PUT" });
};

// Resume playback
export const resumePlayback = () => {
  return spotifyFetch("/me/player/play", { method: "PUT" });
};

// Get current playback state
export const getPlaybackState = () => spotifyFetch("/me/player");

// Add track to playlist
export const addTrackToPlaylist = (playlistId: string, trackUri: string) => {
  console.log(`Adding track ${trackUri} to playlist ${playlistId}`);
  return spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris: [trackUri] }),
  });
};

// Remove track from playlist
export const removeTrackFromPlaylist = (
  playlistId: string,
  trackUri: string,
) => {
  console.log(`Removing track ${trackUri} from playlist ${playlistId}`);
  return spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
  });
};

// Search for tracks
export const searchTracks = (query: string) => {
  return spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
  );
};

// Get playlist followers
export const getPlaylistFollowers = (playlistId: string) => {
  return spotifyFetch(`/playlists/${playlistId}/followers/contains`);
};

// Add collaborator to playlist
export const addCollaboratorToPlaylist = (
  playlistId: string,
  userId: string,
) => {
  return spotifyFetch(`/playlists/${playlistId}/followers`, {
    method: "PUT",
    body: JSON.stringify({ public: false, collaborative: true }),
  });
};

// Search for users
export const searchUsers = (query: string) => {
  return spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=user&limit=10`,
  );
};

// Create a new playlist
export const createPlaylist = (
  userId: string,
  name: string,
  description: string,
  isCollaborative: boolean = false,
) => {
  return spotifyFetch(`/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false,
      collaborative: isCollaborative,
    }),
  });
};
