interface Window {
  Spotify: {
    Player: new (options: Spotify.PlayerOptions) => Spotify.Player;
  };
}

declare namespace Spotify {
  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (data: any) => void): void;
    removeListener(event: string, callback?: (data: any) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlaybackState {
    context: {
      uri: string;
      metadata: Record<string, unknown>;
    };
    disallows: {
      pausing: boolean;
      peeking_next: boolean;
      peeking_prev: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
    };
    duration: number;
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    id: string;
    uri: string;
    type: string;
    media_type: string;
    name: string;
    duration_ms: number;
    artists: Artist[];
    album: Album;
    is_playable: boolean;
  }

  interface Artist {
    name: string;
    uri: string;
  }

  interface Album {
    name: string;
    uri: string;
    images: Image[];
  }

  interface Image {
    url: string;
    height: number;
    width: number;
  }
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    total: number;
    items?: SpotifyPlaylistTrack[];
  };
  commentCount?: number;
  owner?: {
    id: string;
    display_name: string;
  };
  collaborative?: boolean;
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
  };
}
