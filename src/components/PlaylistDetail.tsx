import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  getPlaylistDetails,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  searchTracks,
  searchUsers,
  addCollaboratorToPlaylist,
} from "@/lib/spotify";
import SharePlaylistNotification from "./SharePlaylistNotification";
import { SpotifyPlaylist, SpotifyPlaylistTrack } from "@/types/spotify";
import { useSpotify } from "@/context/SpotifyContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Music,
  Clock,
  ArrowLeft,
  MessageSquare,
  Plus,
  Trash2,
  UserPlus,
  Search,
  X,
  Check,
  Loader2,
  Share2,
  Copy,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import PlaylistPlayer from "./PlaylistPlayer";
import CommentSection from "./CommentSection";
import SharePlaylistDialog from "./SharePlaylistDialog";
import { getPlaylistCommentCount } from "@/lib/playlistComments";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isRemovingTrack, setIsRemovingTrack] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string | null>(null);
  const [collaboratorQuery, setCollaboratorQuery] = useState("");
  const [collaboratorResults, setCollaboratorResults] = useState<any[]>([]);
  const [isSearchingCollaborators, setIsSearchingCollaborators] =
    useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const { playTrack, isPlaying, currentTrackUri, togglePlayPause, user } =
    useSpotify();
  const navigate = useNavigate();

  const fetchPlaylistDetails = async () => {
    if (!playlistId) return;

    try {
      console.log(`Fetching playlist details for ${playlistId}`);
      const response = await getPlaylistDetails(playlistId);
      console.log("Playlist details response:", response);

      // Ensure tracks property exists and has items array
      if (!response.tracks) {
        response.tracks = { items: [] };
      } else if (!response.tracks.items) {
        response.tracks.items = [];
      }

      setPlaylist(response);

      // Get comment count for this playlist
      try {
        const count = await getPlaylistCommentCount(playlistId);
        setCommentCount(count);
      } catch (commentError) {
        console.error("Error fetching comment count:", commentError);
        setCommentCount(0);
      }
    } catch (error) {
      console.error("Error fetching playlist details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetails();
    }
  }, [playlistId]);

  // Handle track search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        console.log(`Searching for tracks with query: ${searchQuery}`);
        const results = await searchTracks(searchQuery);
        console.log("Search results:", results);
        setSearchResults(results.tracks.items || []);
      } catch (error) {
        console.error("Error searching tracks:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500) as unknown as number;

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle collaborator search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (collaboratorQuery.trim().length < 2) {
      setCollaboratorResults([]);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearchingCollaborators(true);
      try {
        const results = await searchUsers(collaboratorQuery);
        setCollaboratorResults(results.users?.items || []);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearchingCollaborators(false);
      }
    }, 500) as unknown as number;

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [collaboratorQuery]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = (uri: string) => {
    playTrack(uri);
  };

  const handleAddTrack = async (trackUri: string) => {
    if (!playlistId) return;

    setIsAddingTrack(true);
    setSelectedTrackUri(trackUri);

    try {
      console.log(`Adding track ${trackUri} to playlist ${playlistId}`);
      const response = await addTrackToPlaylist(playlistId, trackUri);
      console.log("Add track response:", response);

      // Wait a moment before refreshing to allow Spotify API to update
      setTimeout(async () => {
        // Refresh playlist data
        const updatedPlaylist = await getPlaylistDetails(playlistId);
        setPlaylist(updatedPlaylist);

        toast({
          title: "Track added",
          description: "The track has been added to the playlist",
          variant: "default",
        });

        setIsAddingTrack(false);
        setSelectedTrackUri(null);
      }, 1000);
    } catch (error) {
      console.error("Error adding track:", error);
      toast({
        title: "Error",
        description: "Failed to add track to playlist",
        variant: "destructive",
      });
      setIsAddingTrack(false);
      setSelectedTrackUri(null);
    }
  };

  const handleRemoveTrack = async (trackUri: string) => {
    if (!playlistId) return;

    setIsRemovingTrack(true);
    setSelectedTrackUri(trackUri);

    try {
      console.log(`Removing track ${trackUri} from playlist ${playlistId}`);
      const response = await removeTrackFromPlaylist(playlistId, trackUri);
      console.log("Remove track response:", response);

      // Wait a moment before refreshing to allow Spotify API to update
      setTimeout(async () => {
        // Refresh playlist data
        const updatedPlaylist = await getPlaylistDetails(playlistId);
        setPlaylist(updatedPlaylist);

        toast({
          title: "Track removed",
          description: "The track has been removed from the playlist",
          variant: "default",
        });

        setIsRemovingTrack(false);
        setSelectedTrackUri(null);
      }, 1000);
    } catch (error) {
      console.error("Error removing track:", error);
      toast({
        title: "Error",
        description: "Failed to remove track from playlist",
        variant: "destructive",
      });
      setIsRemovingTrack(false);
      setSelectedTrackUri(null);
    }
  };

  const handleAddCollaborator = async (userId: string) => {
    if (!playlistId) return;

    setIsAddingCollaborator(true);

    try {
      await addCollaboratorToPlaylist(playlistId, userId);

      toast({
        title: "Collaborator invited",
        description:
          "An invitation has been sent to collaborate on this playlist",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast({
        title: "Error",
        description: "Failed to invite collaborator",
        variant: "destructive",
      });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  // Check if the current user is the owner of the playlist
  const isPlaylistOwner = playlist?.owner?.id === user?.id;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-6 mb-8">
          <Skeleton className="h-48 w-48 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-2 border-b">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full max-w-md mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4">
        <Music className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Playlist Not Found</h2>
        <p className="text-muted-foreground text-center mb-6">
          We couldn't find the playlist you're looking for.
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Playlists
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Playlists
      </Button>

      <div className="flex items-center gap-3 mb-4 bg-card/50 p-3 rounded-md">
        <div className="flex-shrink-0">
          {playlist.images && playlist.images[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-md shadow-md"
            />
          ) : (
            <div className="h-16 w-16 md:h-20 md:w-20 bg-muted flex items-center justify-center rounded-md">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-lg md:text-xl font-bold truncate">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {playlist.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-xs">{playlist.tracks?.total || 0} tracks</p>
                <p className="text-xs flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {commentCount} comments
                </p>
                {playlist.owner && (
                  <p className="text-xs text-muted-foreground">
                    By: {playlist.owner.display_name}
                  </p>
                )}
                {playlist.collaborative && (
                  <p className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm inline-flex items-center">
                    <UserPlus className="h-2.5 w-2.5 mr-1" />
                    Collaborative
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <div className="md:w-48 lg:w-56">
                <PlaylistPlayer />
              </div>
              <div className="flex gap-1.5">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Tracks to Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Search for tracks..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {searchResults.length === 0 &&
                          searchQuery.trim().length > 1 &&
                          !isSearching && (
                            <p className="text-center text-muted-foreground py-4">
                              No tracks found
                            </p>
                          )}

                        {searchResults.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md"
                          >
                            <div className="flex items-center space-x-3">
                              {track.album.images && track.album.images[0] ? (
                                <img
                                  src={track.album.images[0].url}
                                  alt={track.name}
                                  className="h-10 w-10 rounded-sm"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-sm">
                                  <Music className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {track.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {track.artists
                                    .map((artist: any) => artist.name)
                                    .join(", ")}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTrack(track.uri);
                              }}
                              disabled={
                                isAddingTrack && selectedTrackUri === track.uri
                              }
                            >
                              {isAddingTrack &&
                              selectedTrackUri === track.uri ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {playlist && (
                  <>
                    <SharePlaylistNotification
                      playlistId={playlist.id}
                      playlistName={playlist.name}
                    />
                    <SharePlaylistDialog
                      playlistId={playlist.id}
                      playlistName={playlist.name}
                      isCollaborative={!!playlist.collaborative}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-sm overflow-hidden">
        <div className="flex md:grid md:grid-cols-[auto_1fr_1fr_auto] gap-2 md:gap-4 px-2 md:px-4 py-2 border-b font-medium text-sm text-muted-foreground">
          <span className="w-10 text-center">#</span>
          <span className="flex-1">Title</span>
          <span className="hidden md:block">Album</span>
          <span className="flex items-center justify-end ml-auto md:ml-0">
            <Clock className="h-4 w-4" />
          </span>
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)]">
          {playlist.tracks && playlist.tracks.items ? (
            playlist.tracks.items.map(
              (item: SpotifyPlaylistTrack, index: number) => {
                const { track } = item;
                const isCurrentTrack = currentTrackUri === track.uri;

                return (
                  <div
                    key={track.id || index}
                    className="border-b last:border-b-0"
                  >
                    <div
                      className={`flex items-center gap-2 px-2 md:px-4 py-2 hover:bg-muted/50 ${isCurrentTrack ? "bg-muted" : ""}`}
                    >
                      <div className="w-8 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() =>
                            isCurrentTrack
                              ? togglePlayPause()
                              : handlePlayTrack(track.uri)
                          }
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                        <div className="overflow-hidden">
                          <div className="font-medium truncate text-sm">
                            {track.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {track.artists
                              .map((artist) => artist.name)
                              .join(", ")}
                          </div>
                        </div>
                        <div className="hidden md:block text-xs text-muted-foreground truncate">
                          {track.album.name}
                        </div>
                        <div className="flex items-center gap-2 justify-self-end">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDuration(track.duration_ms)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrack(track.uri);
                            }}
                            disabled={
                              isRemovingTrack && selectedTrackUri === track.uri
                            }
                          >
                            {isRemovingTrack &&
                            selectedTrackUri === track.uri ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="pl-10 pr-2 md:pr-4 pb-2 w-full overflow-hidden bg-muted/30 rounded-b-md border-t border-border/40 mt-1">
                      <CommentSection
                        key={`comment-section-${track.id}`}
                        trackId={track.id}
                        trackName={track.name}
                      />
                    </div>
                  </div>
                );
              },
            )
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                No tracks in this playlist
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
