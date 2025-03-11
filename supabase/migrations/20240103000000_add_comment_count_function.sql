-- Create a stored procedure to get comment counts by playlist_id
CREATE OR REPLACE FUNCTION get_playlist_comment_counts(playlist_ids text[])
RETURNS TABLE (playlist_id text, count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    comments.playlist_id, 
    COUNT(*)::bigint
  FROM 
    comments
  WHERE 
    comments.playlist_id = ANY(playlist_ids)
  GROUP BY 
    comments.playlist_id;
END;
$$;