import { useState, useEffect } from "react";
import { getUserPlaylists } from "@/lib/spotify";
import { SpotifyPlaylist } from "@/types/spotify";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, ListMusic, MessageSquare, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPlaylistsCommentCounts } from "@/lib/playlistComments";
import { format } from "date-fns";

export default function PlaylistGrid() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredPlaylist, setFeaturedPlaylist] =
    useState<SpotifyPlaylist | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await getUserPlaylists();
        const playlistsData = response.items;

        // Get comment counts for all playlists
        const playlistIds = playlistsData.map(
          (playlist: SpotifyPlaylist) => playlist.id,
        );
        console.log("Fetching comment counts for playlists:", playlistIds);
        const commentCounts = await getPlaylistsCommentCounts(playlistIds);
        console.log("Received comment counts:", commentCounts);

        // Add comment counts to playlists
        const playlistsWithComments = playlistsData.map(
          (playlist: SpotifyPlaylist) => ({
            ...playlist,
            commentCount: commentCounts[playlist.id] || 0,
          }),
        );

        // Set the first playlist as featured if available
        if (playlistsWithComments.length > 0) {
          setFeaturedPlaylist(playlistsWithComments[0]);
          setPlaylists(playlistsWithComments.slice(1));
        } else {
          setPlaylists(playlistsWithComments);
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured playlist skeleton */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] w-full" />
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        {/* Other playlists skeleton */}
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-square mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (playlists.length === 0 && !featuredPlaylist) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] p-4 max-w-7xl mx-auto">
        <ListMusic className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Playlists Found</h2>
        <p className="text-muted-foreground text-center">
          You don't have any playlists in your Spotify account yet.
        </p>
      </div>
    );
  }

  // Generate a random date for each playlist to simulate review dates
  const getRandomDate = () => {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Featured Playlist Section */}
      {featuredPlaylist && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold border-b border-primary pb-2 mb-8">
            Featured Playlist
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 cursor-pointer"
            onClick={() => handlePlaylistClick(featuredPlaylist.id)}
          >
            <div className="relative">
              {featuredPlaylist.images && featuredPlaylist.images[0] ? (
                <img
                  src={featuredPlaylist.images[0].url}
                  alt={featuredPlaylist.name}
                  className="w-full h-auto aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                  <Music className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 text-sm font-medium">
                FEATURED
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {featuredPlaylist.name}
              </h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {format(getRandomDate(), "MMMM d, yyyy")}
                </span>
              </div>
              <p className="mb-4 line-clamp-3">
                {featuredPlaylist.description ||
                  "A curated collection of tracks that define a unique musical journey."}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-1" />
                  <span>{featuredPlaylist.tracks.total} tracks</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{featuredPlaylist.commentCount || 0} comments</span>
                </div>
              </div>
              <button
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaylistClick(featuredPlaylist.id);
                }}
              >
                View Playlist
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Regular Playlists Grid */}
      <section>
        <h2 className="text-2xl font-bold border-b border-primary pb-2 mb-8">
          Latest Playlists
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onClick={() => handlePlaylistClick(playlist.id)}
            >
              <div className="relative mb-3 overflow-hidden">
                {playlist.images && playlist.images[0] ? (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <Music className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium">View Details</span>
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                {playlist.name}
              </h3>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{format(getRandomDate(), "MMM d")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <Music className="h-3 w-3 mr-1" />
                    <span>{playlist.tracks.total}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{playlist.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
