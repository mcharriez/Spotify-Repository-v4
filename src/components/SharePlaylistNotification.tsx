import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Bell, Loader2, UserPlus } from "lucide-react";
import { sendPlaylistFollowNotification } from "@/lib/playlistNotifications";

interface SharePlaylistNotificationProps {
  playlistId: string;
  playlistName: string;
}

export default function SharePlaylistNotification({
  playlistId,
  playlistName,
}: SharePlaylistNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!email.trim()) return;

    setIsSending(true);
    try {
      await sendPlaylistFollowNotification({
        playlistId,
        playlistName,
        recipientEmail: email.trim(),
        message: message.trim(),
      });

      toast({
        title: "Notification sent",
        description: `An invitation to follow "${playlistName}" has been sent to ${email}`,
        variant: "default",
      });

      setIsOpen(false);
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Bell className="h-3.5 w-3.5 mr-1" />
          Invite to Follow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Follow Playlist</DialogTitle>
          <DialogDescription>
            Send a notification to invite someone to follow "{playlistName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <Input
              id="message"
              placeholder="Check out this playlist I made!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSendNotification}
            disabled={isSending || !email.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
