import { useState } from "react";
import { useSpotify } from "@/context/SpotifyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Share2, Copy, Check, MessageSquare } from "lucide-react";

interface SharePlaylistDialogProps {
  playlistId: string;
  playlistName: string;
  isCollaborative: boolean;
}

export default function SharePlaylistDialog({
  playlistId,
  playlistName,
  isCollaborative,
}: SharePlaylistDialogProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useSpotify();

  const shareUrl = `${window.location.origin}/playlist/${playlistId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Playlist link copied to clipboard",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareViaMessages = () => {
    const messageText = `Check out this playlist: ${playlistName} ${shareUrl}`;

    // Create SMS URI without a specific recipient
    const smsUri = `sms:?body=${encodeURIComponent(messageText)}`;

    // Open the native messaging app
    window.location.href = smsUri;

    toast({
      title: "Opening messaging app",
      description: "Your device's messaging app should open automatically",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleShareViaMessages}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Playlist</DialogTitle>
          <DialogDescription>
            {isCollaborative
              ? "Share this collaborative playlist with friends to let them add tracks."
              : "Share this playlist with friends."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label>Playlist Link</Label>
            <div className="flex items-center space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isCollaborative && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Collaborative Playlist</p>
              <p className="text-muted-foreground mt-1">
                Anyone with this link can view this playlist. Only invited
                collaborators can add or remove tracks.
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button onClick={handleShareViaMessages} className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Messages App
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This will open your device's messaging app with a pre-filled
              message containing the playlist link.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
