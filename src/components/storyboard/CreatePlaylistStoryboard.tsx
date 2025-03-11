import CreatePlaylistDialog from "../CreatePlaylistDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreatePlaylistStoryboard() {
  return (
    <div className="p-8 bg-background min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create a New Playlist</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <CreatePlaylistDialog />
        </CardContent>
      </Card>
    </div>
  );
}
