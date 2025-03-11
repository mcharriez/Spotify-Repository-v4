import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export interface Comment {
  id: string;
  track_id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  likes: number;
  parent_id?: string;
}

// Fetch comments for a track
export async function getTrackComments(trackId: string): Promise<Comment[]> {
  console.log("Fetching comments from Supabase for track:", trackId);

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("track_id", trackId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} comments for track ${trackId}`);
    return data || [];
  } catch (e) {
    console.error("Exception when fetching comments:", e);
    return [];
  }
}

// Add a new comment
export async function addComment({
  trackId,
  text,
  authorId,
  authorName,
  authorAvatar,
  parentId,
}: {
  trackId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  parentId?: string;
}): Promise<Comment | null> {
  console.log("Adding comment to Supabase:", {
    trackId,
    text,
    authorId,
    authorName,
  });

  // If trackId is already in the format "spotify:track:id", extract just the ID
  const trackIdParts = trackId.split(":");
  const actualTrackId =
    trackIdParts.length > 1 ? trackIdParts[trackIdParts.length - 1] : trackId;

  // Get playlist ID from URL
  const pathParts = window.location.pathname.split("/");
  const playlistId = pathParts[pathParts.indexOf("playlist") + 1];

  console.log("Adding comment with playlist_id:", playlistId);

  const newComment = {
    id: uuidv4(),
    track_id: actualTrackId,
    playlist_id: playlistId, // Remove the || null to ensure we always have a value
    text,
    author_id: authorId,
    author_name: authorName,
    author_avatar: authorAvatar,
    created_at: new Date().toISOString(),
    likes: 0,
    parent_id: parentId,
  };

  try {
    // First try a simple insert without returning data
    const { error: insertError } = await supabase
      .from("comments")
      .insert([newComment]);

    if (insertError) {
      console.error("Error adding comment:", insertError);
      return null;
    }

    console.log("Comment added successfully");
    return newComment; // Return the comment we created since we know it was inserted successfully
  } catch (e) {
    console.error("Exception when adding comment:", e);
    return null;
  }
}

// Like a comment
export async function likeComment(commentId: string): Promise<boolean> {
  // First get the current likes count
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("likes")
    .eq("id", commentId)
    .single();

  if (fetchError) {
    console.error("Error fetching comment likes:", fetchError);
    return false;
  }

  // Increment the likes count
  const { error: updateError } = await supabase
    .from("comments")
    .update({ likes: (comment?.likes || 0) + 1 })
    .eq("id", commentId);

  if (updateError) {
    console.error("Error updating comment likes:", updateError);
    return false;
  }

  return true;
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    return false;
  }

  return true;
}
