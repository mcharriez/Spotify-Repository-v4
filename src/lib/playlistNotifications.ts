import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

interface PlaylistFollowNotification {
  playlistId: string;
  playlistName: string;
  recipientEmail: string;
  message?: string;
}

// Send a notification to invite someone to follow a playlist
export const sendPlaylistFollowNotification = async ({
  playlistId,
  playlistName,
  recipientEmail,
  message,
}: PlaylistFollowNotification) => {
  // Create a notification record in Supabase
  const { data, error } = await supabase
    .from("playlist_follow_notifications")
    .insert([
      {
        id: uuidv4(),
        playlist_id: playlistId,
        playlist_name: playlistName,
        recipient_email: recipientEmail,
        message: message || null,
        status: "pending",
      },
    ])
    .select();

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }

  return data[0];
};

// Get notifications for a user by email
export const getNotificationsForUser = async (email: string) => {
  const { data, error } = await supabase
    .from("playlist_follow_notifications")
    .select("*")
    .eq("recipient_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }

  return data;
};

// Accept a follow invitation (follow the playlist)
export const acceptFollowInvitation = async (
  notificationId: string,
  playlistId: string,
) => {
  // First, follow the playlist using Spotify API
  const token = localStorage.getItem("spotify_token");
  if (!token) throw new Error("No authentication token found");

  // Follow the playlist
  const followResponse = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public: true }),
    },
  );

  if (!followResponse.ok) {
    throw new Error("Failed to follow playlist");
  }

  // Update notification status in Supabase
  const { error } = await supabase
    .from("playlist_follow_notifications")
    .update({ status: "accepted" })
    .eq("id", notificationId);

  if (error) {
    console.error("Error updating notification:", error);
    throw new Error("Failed to update notification status");
  }

  return true;
};

// Decline a follow invitation
export const declineFollowInvitation = async (notificationId: string) => {
  const { error } = await supabase
    .from("playlist_follow_notifications")
    .update({ status: "declined" })
    .eq("id", notificationId);

  if (error) {
    console.error("Error updating notification:", error);
    throw new Error("Failed to update notification status");
  }

  return true;
};
