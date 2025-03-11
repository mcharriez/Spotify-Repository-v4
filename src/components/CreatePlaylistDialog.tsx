import { useState } from "react";
import { useSpotify } from "@/context/SpotifyContext";
import { createPlaylist } from "@/lib/spotify";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus } from "lucide-react";

export default function CreatePlaylistDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useSpotify();
  const navigate = useNavigate();

  const handleCreatePlaylist = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      console.log(`Creating playlist: ${name} for user ${user.id}`);
      const newPlaylist = await createPlaylist(
        user.id,
        name,
        description,
        isCollaborative,
      );
      console.log("New playlist created:", newPlaylist);

      toast({
        title: "Playlist created",
        description: `${name} has been created successfully`,
      });

      // Close dialog and navigate to the new playlist
      setOpen(false);
      navigate(`/playlist/${newPlaylist.id}`);
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIsCollaborative(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogDescription>
            Create a new playlist to share with friends and collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A collection of my favorite tracks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="collaborative" className="cursor-pointer">
              Collaborative Playlist
            </Label>
            <Switch
              id="collaborative"
              checked={isCollaborative}
              onCheckedChange={setIsCollaborative}
            />
          </div>
          {isCollaborative && (
            <p className="text-sm text-muted-foreground">
              Collaborative playlists allow others to add, remove, and reorder
              tracks.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreatePlaylist} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Playlist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
