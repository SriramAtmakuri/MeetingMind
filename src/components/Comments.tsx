import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { meetingsApi } from "@/lib/api";
import { formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CommentsProps {
  meetingId: string;
  userId?: string;
  transcriptId?: string;
  timestamp?: number;
}

const Comments = ({
  meetingId,
  userId = "user-123",
  transcriptId,
  timestamp,
}: CommentsProps) => {
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["comments", meetingId, transcriptId],
    queryFn: () => meetingsApi.getComments(meetingId),
  });

  const allComments = commentsData?.comments || [];

  // Filter comments by transcript ID if provided
  const comments = transcriptId
    ? allComments.filter((c: any) => c.transcript_id === transcriptId)
    : allComments;

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: any) => meetingsApi.addComment(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", meetingId],
      });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addCommentMutation.mutate({
      userId,
      text: commentText.trim(),
      transcriptId: transcriptId || null,
      timestamp: timestamp || null,
    });
  };

  const getUserInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index =
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {/* Comments List */}
      <ScrollArea className="h-[400px] pr-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <MessageSquare className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to leave a comment
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <Card key={comment.id} className="p-4">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback
                      className={`${getAvatarColor(
                        comment.user_id
                      )} text-white`}
                    >
                      {getUserInitials(comment.user_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.user_id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                      {comment.timestamp !== null &&
                        comment.timestamp !== undefined && (
                          <span className="text-xs text-primary">
                            @ {formatTimestamp(comment.timestamp)}
                          </span>
                        )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder={
            timestamp
              ? `Add a comment at ${formatTimestamp(timestamp)}...`
              : "Add a comment..."
          }
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              !commentText.trim() || addCommentMutation.isPending
            }
          >
            <Send className="w-4 h-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Comments;
