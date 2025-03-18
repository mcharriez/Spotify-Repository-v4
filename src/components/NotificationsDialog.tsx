import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useSpotify } from "@/context/SpotifyContext";
import {
  getNotificationsForUser,
  acceptFollowInvitation,
  declineFollowInvitation,
} from "@/lib/playlistNotifications";
import { Bell, Check, X, Loader2, Music } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  playlist_id: string;
  playlist_name: string;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export default function NotificationsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user } = useSpotify();

  const fetchNotifications = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const data = await getNotificationsForUser(user.email);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.email) {
      fetchNotifications();
    }
  }, [isOpen, user?.email]);

  const handleAccept = async (notification: Notification) => {
    setProcessingIds((prev) => [...prev, notification.id]);
    try {
      await acceptFollowInvitation(notification.id, notification.playlist_id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, status: "accepted" } : n,
        ),
      );

      toast({
        title: "Playlist followed",
        description: `You are now following "${notification.playlist_name}"`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to follow playlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notification.id));
    }
  };

  const handleDecline = async (notification: Notification) => {
    setProcessingIds((prev) => [...prev, notification.id]);
    try {
      await declineFollowInvitation(notification.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, status: "declined" } : n,
        ),
      );

      toast({
        title: "Invitation declined",
        description: `You declined to follow "${notification.playlist_name}"`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notification.id));
    }
  };

  const pendingNotifications = notifications.filter(
    (n) => n.status === "pending",
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {pendingNotifications.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Playlist Invitations</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        Playlist: {notification.playlist_name}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{notification.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(
                          new Date(notification.created_at),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                    </div>
                    {notification.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleAccept(notification)}
                          disabled={processingIds.includes(notification.id)}
                        >
                          {processingIds.includes(notification.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDecline(notification)}
                          disabled={processingIds.includes(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${notification.status === "accepted" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {notification.status === "accepted"
                          ? "Followed"
                          : "Declined"}
                      </span>
                    )}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
