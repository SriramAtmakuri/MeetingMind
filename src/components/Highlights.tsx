import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Highlighter,
  Trash2,
  Plus,
  Play,
} from "lucide-react";
import { meetingsApi } from "@/lib/api";
import { formatTimestamp, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface HighlightsProps {
  meetingId: string;
  userId?: string;
  onSeek?: (time: number) => void;
}

const Highlights = ({
  meetingId,
  userId = "user-123",
  onSeek,
}: HighlightsProps) => {
  const [selectedText, setSelectedText] = useState<{
    text: string;
    startTime: number;
    endTime: number;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch highlights
  const { data: highlightsData, isLoading } = useQuery({
    queryKey: ["highlights", meetingId],
    queryFn: () => meetingsApi.getHighlights(meetingId),
  });

  const highlights = highlightsData?.highlights || [];

  // Add highlight mutation
  const addHighlightMutation = useMutation({
    mutationFn: (data: any) => meetingsApi.addHighlight(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["highlights", meetingId],
      });
      setSelectedText(null);
      toast({
        title: "Highlight added",
        description: "Text has been highlighted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add highlight",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete highlight mutation
  const deleteHighlightMutation = useMutation({
    mutationFn: (highlightId: string) =>
      meetingsApi.deleteHighlight(meetingId, highlightId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["highlights", meetingId],
      });
      toast({
        title: "Highlight removed",
        description: "Highlight has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete highlight",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddHighlight = (color: string) => {
    if (!selectedText) return;

    addHighlightMutation.mutate({
      userId,
      startTime: selectedText.startTime,
      endTime: selectedText.endTime,
      text: selectedText.text,
      color,
    });
  };

  const handleDelete = (highlightId: string) => {
    if (window.confirm("Are you sure you want to remove this highlight?")) {
      deleteHighlightMutation.mutate(highlightId);
    }
  };

  const handleJumpToTime = (time: number) => {
    if (onSeek) {
      onSeek(time);
    }
  };

  const highlightColors = [
    { name: "Yellow", value: "#fbbf24", class: "bg-yellow-400" },
    { name: "Green", value: "#10b981", class: "bg-green-500" },
    { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
    { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
    { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Highlighter className="w-5 h-5" />
          Highlights
          {highlights.length > 0 && (
            <Badge variant="secondary">{highlights.length}</Badge>
          )}
        </h3>
      </div>

      {/* Selection Helper */}
      {selectedText && (
        <Card className="p-4 border-primary">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Selected text at {formatTimestamp(selectedText.startTime)}:
              </p>
              <p className="text-sm bg-muted p-2 rounded">
                {selectedText.text}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Choose highlight color:</p>
              <div className="flex gap-2 flex-wrap">
                {highlightColors.map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddHighlight(color.value)}
                    disabled={addHighlightMutation.isPending}
                    className="gap-2"
                  >
                    <div className={`w-4 h-4 rounded ${color.class}`} />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedText(null)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Highlights List */}
      <ScrollArea className="h-[400px] pr-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : highlights.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Highlighter className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  No highlights yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select text from the transcript to create your first highlight
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {highlights.map((highlight: any) => (
              <Card
                key={highlight.id}
                className="p-4 border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeftColor: highlight.color }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleJumpToTime(highlight.start_time)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {formatTimestamp(highlight.start_time)} -{" "}
                        {formatTimestamp(highlight.end_time)}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(highlight.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {highlight.text}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(highlight.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Instructions */}
      {!selectedText && highlights.length === 0 && (
        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Select any text in the transcript to
            create a highlight. Highlights help you quickly reference important
            moments.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Highlights;
