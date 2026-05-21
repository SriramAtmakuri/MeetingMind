import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Edit2, Check, X } from "lucide-react";
import { meetingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Speaker {
  id: string;
  name: string;
  custom_name?: string;
  color?: string;
  email?: string;
  role?: string;
  word_count?: number;
}

interface SpeakerManagementProps {
  meetingId: string;
  speakers: Speaker[];
}

const SpeakerManagement = ({
  meetingId,
  speakers,
}: SpeakerManagementProps) => {
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customName: "",
    color: "",
    email: "",
    role: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSpeakerMutation = useMutation({
    mutationFn: ({
      speakerId,
      data,
    }: {
      speakerId: string;
      data: any;
    }) => meetingsApi.updateSpeaker(meetingId, speakerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      setEditingSpeakerId(null);
      toast({
        title: "Speaker updated",
        description: "Speaker information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update speaker. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (speaker: Speaker) => {
    setEditingSpeakerId(speaker.id);
    setEditForm({
      customName: speaker.custom_name || speaker.name,
      color: speaker.color || "#3b82f6",
      email: speaker.email || "",
      role: speaker.role || "",
    });
  };

  const cancelEditing = () => {
    setEditingSpeakerId(null);
    setEditForm({
      customName: "",
      color: "",
      email: "",
      role: "",
    });
  };

  const saveChanges = (speakerId: string) => {
    updateSpeakerMutation.mutate({
      speakerId,
      data: {
        customName: editForm.customName,
        color: editForm.color,
        email: editForm.email || undefined,
        role: editForm.role || undefined,
      },
    });
  };

  const predefinedColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Speakers</h3>
        <Badge variant="secondary">{speakers.length} speakers</Badge>
      </div>

      <div className="space-y-3">
        {speakers.map((speaker) => {
          const isEditing = editingSpeakerId === speaker.id;
          const displayName = speaker.custom_name || speaker.name;
          const speakerColor = speaker.color || "#3b82f6";

          return (
            <Card key={speaker.id} className="p-4">
              {!isEditing ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: speakerColor }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{displayName}</h4>
                        {speaker.role && (
                          <Badge variant="outline" className="text-xs">
                            {speaker.role}
                          </Badge>
                        )}
                      </div>
                      {speaker.email && (
                        <p className="text-sm text-muted-foreground">
                          {speaker.email}
                        </p>
                      )}
                      {speaker.word_count !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {speaker.word_count} words spoken
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(speaker)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${speaker.id}`}>Name</Label>
                      <Input
                        id={`name-${speaker.id}`}
                        value={editForm.customName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            customName: e.target.value,
                          })
                        }
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`role-${speaker.id}`}>Role</Label>
                      <Input
                        id={`role-${speaker.id}`}
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                        placeholder="e.g., Product Manager"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email-${speaker.id}`}>Email</Label>
                    <Input
                      id={`email-${speaker.id}`}
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setEditForm({ ...editForm, color })
                          }
                          className={`w-8 h-8 rounded-full border-2 ${
                            editForm.color === color
                              ? "border-gray-900"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <Input
                        type="color"
                        value={editForm.color}
                        onChange={(e) =>
                          setEditForm({ ...editForm, color: e.target.value })
                        }
                        className="w-12 h-8 p-0 border-0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={updateSpeakerMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveChanges(speaker.id)}
                      disabled={updateSpeakerMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {speakers.length === 0 && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <User className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No speakers detected</h3>
              <p className="text-sm text-muted-foreground">
                Speakers will appear here after the meeting is processed
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SpeakerManagement;
