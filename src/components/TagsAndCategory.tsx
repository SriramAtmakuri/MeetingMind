import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tag, FolderOpen, X, Plus, Save } from "lucide-react";
import { meetingsApi } from "@/lib/api";
import { parseTags } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TagsAndCategoryProps {
  meetingId: string;
  currentTags?: string;
  currentCategory?: string;
  currentNotes?: string;
}

const TagsAndCategory = ({
  meetingId,
  currentTags = "",
  currentCategory = "",
  currentNotes = "",
}: TagsAndCategoryProps) => {
  const [tags, setTags] = useState<string[]>(parseTags(currentTags));
  const [newTag, setNewTag] = useState("");
  const [category, setCategory] = useState(currentCategory || "");
  const [notes, setNotes] = useState(currentNotes || "");
  const [isEditing, setIsEditing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMetadataMutation = useMutation({
    mutationFn: (data: any) => meetingsApi.updateMetadata(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setIsEditing(false);
      toast({
        title: "Meeting updated",
        description: "Tags, category, and notes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update meeting metadata. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    updateMetadataMutation.mutate({
      tags: tags.join(","),
      category: category || undefined,
      notes: notes || undefined,
    });
  };

  const handleCancel = () => {
    setTags(parseTags(currentTags));
    setCategory(currentCategory || "");
    setNotes(currentNotes || "");
    setIsEditing(false);
  };

  const categories = [
    { value: "standup", label: "Standup" },
    { value: "planning", label: "Planning" },
    { value: "review", label: "Review" },
    { value: "retrospective", label: "Retrospective" },
    { value: "client", label: "Client Meeting" },
    { value: "brainstorm", label: "Brainstorming" },
    { value: "training", label: "Training" },
    { value: "interview", label: "Interview" },
    { value: "other", label: "Other" },
  ];

  const suggestedTags = [
    "important",
    "follow-up",
    "urgent",
    "project-alpha",
    "quarterly",
    "team-sync",
    "product",
    "engineering",
    "design",
    "marketing",
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Category Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FolderOpen className="w-4 h-4" />
                Category
              </Label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                {category ? (
                  <Badge variant="outline" className="text-sm">
                    {categories.find((c) => c.value === category)?.label ||
                      category}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No category set
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Tag className="w-4 h-4" />
              Tags
            </Label>

            {/* Display Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>

            {/* Add Tag Input */}
            {isEditing && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Suggested Tags */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Suggested tags:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags
                      .filter((tag) => !tags.includes(tag))
                      .map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTags([...tags, tag]);
                          }}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes
            </Label>
            {isEditing ? (
              <Textarea
                id="notes"
                placeholder="Add private notes about this meeting..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            ) : (
              <div>
                {notes ? (
                  <Card className="p-3 bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMetadataMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMetadataMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TagsAndCategory;
