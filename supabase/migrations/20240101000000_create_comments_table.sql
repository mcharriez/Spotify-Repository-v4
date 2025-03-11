-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY,
  track_id TEXT NOT NULL,
  text TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  parent_id UUID REFERENCES public.comments(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS comments_track_id_idx ON public.comments(track_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);

-- Set up row level security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read comments
CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  USING (true);

-- Allow anyone to insert comments (since we're using Spotify auth, not Supabase auth)
CREATE POLICY "Anyone can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update comments (we'll handle auth in the app)
CREATE POLICY "Anyone can update comments"
  ON public.comments FOR UPDATE
  USING (true);

-- Allow anyone to delete comments (we'll handle auth in the app)
CREATE POLICY "Anyone can delete comments"
  ON public.comments FOR DELETE
  USING (true);
