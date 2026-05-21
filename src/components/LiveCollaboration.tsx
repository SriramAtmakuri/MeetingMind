import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  MessageSquare,
  Smile,
  ThumbsUp,
  Lightbulb,
  HelpCircle,
  Send,
  Eye,
  Radio,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface LiveCollaborationProps {
  meetingId: string;
  isLive?: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: string;
}

interface CollaborativeNote {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  color: string;
}

interface Reaction {
  id: string;
  userId: string;
  userName: string;
  type: "thumbsup" | "lightbulb" | "question" | "smile";
  timestamp: number;
  transcriptTime: number;
}

const LiveCollaboration = ({ meetingId, isLive = false }: LiveCollaborationProps) => {
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: "Sarah Chen",
      color: "#3b82f6",
      isActive: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Mike Johnson",
      color: "#10b981",
      isActive: true,
      lastSeen: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      color: "#8b5cf6",
      isActive: false,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
    },
  ]);

  const [collaborativeNotes, setCollaborativeNotes] = useState<CollaborativeNote[]>([
    {
      id: "1",
      userId: "1",
      userName: "Sarah Chen",
      text: "Great point about the mobile-first approach!",
      timestamp: Date.now() - 120000,
      color: "#3b82f6",
    },
    {
      id: "2",
      userId: "2",
      userName: "Mike Johnson",
      text: "We should follow up on the API performance concerns",
      timestamp: Date.now() - 60000,
      color: "#10b981",
    },
  ]);

  const [reactions, setReactions] = useState<Reaction[]>([
    {
      id: "1",
      userId: "1",
      userName: "Sarah Chen",
      type: "lightbulb",
      timestamp: Date.now() - 180000,
      transcriptTime: 450,
    },
    {
      id: "2",
      userId: "2",
      userName: "Mike Johnson",
      type: "thumbsup",
      timestamp: Date.now() - 90000,
      transcriptTime: 720,
    },
  ]);

  const [newNote, setNewNote] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLive) return;

    const phrases = [
      "So the key point here is...",
      "We need to prioritize the user experience.",
      "Let me share the latest metrics.",
      "I agree with that assessment.",
      "What about the timeline for Q2?",
    ];

    let index = 0;
    const interval = setInterval(() => {
      setLiveTranscript(phrases[index % phrases.length]);
      index++;
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const randomUser = participants[Math.floor(Math.random() * participants.length)];
      if (Math.random() > 0.7) {
        setTypingUsers([randomUser.name]);
        setTimeout(() => setTypingUsers([]), 2000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive, participants]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: CollaborativeNote = {
      id: Date.now().toString(),
      userId: "current-user",
      userName: "You",
      text: newNote,
      timestamp: Date.now(),
      color: "#ec4899",
    };

    setCollaborativeNotes([...collaborativeNotes, note]);
    setNewNote("");

    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  const handleAddReaction = (type: Reaction["type"]) => {
    const reaction: Reaction = {
      id: Date.now().toString(),
      userId: "current-user",
      userName: "You",
      type,
      timestamp: Date.now(),
      transcriptTime: Math.floor(Math.random() * 1800),
    };

    setReactions([...reactions, reaction]);
  };

  const getReactionIcon = (type: Reaction["type"]) => {
    switch (type) {
      case "thumbsup":
        return <ThumbsUp className="w-4 h-4" />;
      case "lightbulb":
        return <Lightbulb className="w-4 h-4" />;
      case "question":
        return <HelpCircle className="w-4 h-4" />;
      case "smile":
        return <Smile className="w-4 h-4" />;
    }
  };

  const getReactionColor = (type: Reaction["type"]) => {
    switch (type) {
      case "thumbsup":
        return "text-blue-500";
      case "lightbulb":
        return "text-yellow-500";
      case "question":
        return "text-purple-500";
      case "smile":
        return "text-green-500";
    }
  };

  return (
    <div className="space-y-6">
      {isLive && (
        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <Radio className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Live Meeting in Progress
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Real-time transcription and collaboration active
              </p>
            </div>
            <Badge variant="destructive" className="gap-1">
              <Eye className="w-3 h-3" />
              {participants.filter(p => p.isActive).length} viewing
            </Badge>
          </div>
        </Card>
      )}

      {isLive && liveTranscript && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">
                Live Transcription
              </span>
            </div>
            <p className="text-sm font-medium">{liveTranscript}</p>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants
                <Badge variant="secondary">{participants.length}</Badge>
              </h3>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10" style={{ backgroundColor: participant.color }}>
                        <AvatarFallback className="text-white font-medium">
                          {participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {participant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.isActive
                          ? "Active now"
                          : `Last seen ${formatRelativeTime(participant.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Collaborative Notes
                <Badge variant="secondary">{collaborativeNotes.length}</Badge>
              </h3>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-3" ref={scrollRef}>
                {collaborativeNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="w-8 h-8" style={{ backgroundColor: note.color }}>
                      <AvatarFallback className="text-white text-xs font-medium">
                        {note.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{note.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(note.timestamp).toISOString())}
                        </span>
                      </div>
                      <p className="text-sm">{note.text}</p>
                    </div>
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground italic">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    {typingUsers[0]} is typing...
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Add a collaborative note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddNote();
                  }
                }}
              />
              <Button onClick={handleAddNote} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Smile className="w-5 h-5" />
              Live Reactions
              <Badge variant="secondary">{reactions.length}</Badge>
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddReaction("thumbsup")}
                className="gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Agree
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddReaction("lightbulb")}
                className="gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Idea
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddReaction("question")}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Question
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddReaction("smile")}
                className="gap-2"
              >
                <Smile className="w-4 h-4" />
                Happy
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {reactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reactions yet. Be the first to react!</p>
                </div>
              ) : (
                reactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-background ${getReactionColor(reaction.type)}`}>
                        {getReactionIcon(reaction.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{reaction.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(reaction.timestamp).toISOString())}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      @{Math.floor(reaction.transcriptTime / 60)}:{String(reaction.transcriptTime % 60).padStart(2, '0')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Collaborate in real-time with your team. Add notes,
          react to key moments, and see who's actively viewing the meeting. All changes
          sync automatically across all participants.
        </p>
      </Card>
    </div>
  );
};

export default LiveCollaboration;
