import { supabase } from "./supabase";

// Get the total number of comments for a playlist
export async function getPlaylistCommentCount(
  playlistId: string,
): Promise<number> {
  try {
    // Get count of comments with this playlist_id
    const { data, error } = await supabase
      .from("comments")
      .select("id")
      .eq("playlist_id", playlistId);

    if (error) {
      console.error("Error fetching playlist comment count:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (e) {
    console.error("Exception when fetching playlist comment count:", e);
    return 0;
  }
}

// Get comment counts for multiple playlists
export async function getPlaylistsCommentCounts(
  playlistIds: string[],
): Promise<Record<string, number>> {
  try {
    if (playlistIds.length === 0) return {};

    // Initialize counts for all playlists
    const counts: Record<string, number> = {};
    playlistIds.forEach((id) => {
      counts[id] = 0;
    });

    // Get counts for each playlist individually since the RPC might not be working
    for (const playlistId of playlistIds) {
      const { data, error } = await supabase
        .from("comments")
        .select("id")
        .eq("playlist_id", playlistId);

      if (!error && data) {
        counts[playlistId] = data.length;
      }
    }

    console.log("Playlist comment counts:", counts);
    return counts;
  } catch (e) {
    console.error("Exception when fetching playlists comment counts:", e);
    return {};
  }
}
