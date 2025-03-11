-- Add playlist_id column to comments table
ALTER TABLE public.comments ADD COLUMN playlist_id TEXT;

-- Create index for faster queries on playlist_id
CREATE INDEX IF NOT EXISTS comments_playlist_id_idx ON public.comments(playlist_id);

-- Update existing comments to extract playlist_id from track_id
UPDATE public.comments
SET playlist_id = (
  CASE 
    WHEN track_id LIKE 'track:%:%' THEN 
      (SELECT split_part(track_id, ':', 2))
    ELSE NULL
  END
);
