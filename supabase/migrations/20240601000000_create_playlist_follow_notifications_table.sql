-- Create playlist follow notifications table
CREATE TABLE IF NOT EXISTS public.playlist_follow_notifications (
  id UUID PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  playlist_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_playlist_follow_notifications_recipient_email ON public.playlist_follow_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_playlist_follow_notifications_status ON public.playlist_follow_notifications(status);

