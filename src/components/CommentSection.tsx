import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSpotify } from "@/context/SpotifyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getTrackComments,
  addComment,
  likeComment,
  deleteComment,
} from "@/lib/comments";
import { Comment } from "@/lib/comments";

interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

interface CommentProps {
  comment: CommentWithReplies;
  onReply: (parentId: string, text: string) => void;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  onReply,
  onLike,
  onDelete,
  depth = 0,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { user } = useSpotify();
  const maxDepth = 3;

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText("");
      setIsReplying(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div
      className={`${depth > 0 ? "border-l-2 pl-2 md:pl-4" : ""} border-muted mt-3 max-w-full overflow-hidden`}
    >
      <div className="flex gap-2 w-full overflow-hidden">
        <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
          <AvatarImage src={comment.author_avatar} />
          <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium text-sm">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(comment.created_at)}
            </span>
          </div>
          <p className="text-sm mt-1 break-words whitespace-normal overflow-hidden">
            {comment.text}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-1 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => onLike(comment.id)}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </Button>
            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-1 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
            {user && comment.author_id === user.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onDelete(comment.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <div className="relative">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] text-sm pr-24"
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplying(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleReplySubmit}>
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentSectionProps {
  trackId: string;
  trackName: string;
}

export default function CommentSection({
  trackId,
  trackName,
}: CommentSectionProps) {
  const { user } = useSpotify();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch comments from the database
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      console.log("Fetching comments for track:", trackId);
      try {
        const commentsData = await getTrackComments(trackId);
        console.log("Comments data received:", commentsData);

        // Organize comments into a tree structure
        const commentMap = new Map<string, CommentWithReplies>();
        const rootComments: CommentWithReplies[] = [];

        // First pass: create comment objects with empty replies array
        commentsData.forEach((comment) => {
          commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: organize into parent-child relationships
        commentsData.forEach((comment) => {
          const commentWithReplies = commentMap.get(comment.id)!;

          if (comment.parent_id && commentMap.has(comment.parent_id)) {
            // This is a reply, add it to its parent
            const parent = commentMap.get(comment.parent_id)!;
            parent.replies.push(commentWithReplies);
          } else {
            // This is a root comment
            rootComments.push(commentWithReplies);
          }
        });

        console.log("Processed comments structure:", rootComments);
        setComments(rootComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComments();
  }, [trackId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSaving(true);
    console.log("Adding comment for track:", trackId);
    console.log("User info:", user);

    try {
      const savedComment = await addComment({
        trackId,
        text: newComment,
        authorId: user.id,
        authorName: user.display_name,
        authorAvatar: user.images?.[0]?.url,
      });

      console.log("Response from addComment:", savedComment);

      if (savedComment) {
        const newCommentWithReplies: CommentWithReplies = {
          ...savedComment,
          replies: [],
        };
        setComments([newCommentWithReplies, ...comments]);
        setNewComment("");
        console.log("Comment added to state");
      } else {
        console.error("Failed to add comment - no data returned");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (!user) return;

    try {
      const savedReply = await addComment({
        trackId,
        text,
        authorId: user.id,
        authorName: user.display_name,
        authorAvatar: user.images?.[0]?.url,
        parentId,
      });

      if (savedReply) {
        const newReplyWithReplies: CommentWithReplies = {
          ...savedReply,
          replies: [],
        };

        const addReplyToComment = (
          comment: CommentWithReplies,
        ): CommentWithReplies => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReplyWithReplies],
            };
          }

          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(addReplyToComment),
            };
          }

          return comment;
        };

        setComments(comments.map(addReplyToComment));
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const success = await likeComment(id);

      if (success) {
        const likeCommentInState = (
          comment: CommentWithReplies,
        ): CommentWithReplies => {
          if (comment.id === id) {
            return {
              ...comment,
              likes: comment.likes + 1,
            };
          }

          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(likeCommentInState),
            };
          }

          return comment;
        };

        setComments(comments.map(likeCommentInState));
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteComment(id);

      if (success) {
        const filterComments = (
          comments: CommentWithReplies[],
        ): CommentWithReplies[] => {
          return comments
            .filter((comment) => comment.id !== id)
            .map((comment) => ({
              ...comment,
              replies: filterComments(comment.replies),
            }));
        };

        setComments(filterComments(comments));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (!isExpanded) {
    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-1"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(true)}
        >
          <MessageSquare className="h-4 w-4" />
          {comments.length > 0
            ? `Show comments (${comments.length})`
            : "Add a comment"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-1 w-full overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <h3 className="text-xs font-medium">Comments</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsExpanded(false)}
        >
          Hide
        </Button>
      </div>

      {user ? (
        <div className="flex gap-2 w-full overflow-hidden">
          <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
            <AvatarImage src={user.images?.[0]?.url} />
            <AvatarFallback>
              {user.display_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="relative">
              <Textarea
                placeholder="What do you think about this track?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] text-sm pr-24"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={isSaving}
                className="absolute bottom-2 right-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Comment"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to leave a comment
        </p>
      )}

      <div className="mt-3 space-y-2 w-full overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}
