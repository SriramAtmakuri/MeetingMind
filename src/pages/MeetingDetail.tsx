import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Clock,
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  User,
  Calendar,
  Bot,
  Star,
  ArrowLeftRight,
  Link2,
  Search,
  Activity,
  Heart,
  Loader2,
  FileDown,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { meetingsApi, exportApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDuration, formatRelativeTime, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/AudioPlayer";
import SpeakerManagement from "@/components/SpeakerManagement";
import Comments from "@/components/Comments";
import Highlights from "@/components/Highlights";
import TagsAndCategory from "@/components/TagsAndCategory";
import AIChatDialog from "@/components/AIChatDialog";
import BackToTop from "@/components/BackToTop";

function computeHealthScore(meeting: any) {
  const actionItems = meeting.action_items || [];
  const transcript = meeting.transcript || [];
  const speakers = meeting.speakers || [];
  const duration = meeting.duration || 0;

  // Participation balance (0-100): lower variance = better
  let participationScore = 70;
  if (speakers.length > 1 && transcript.length > 0) {
    const counts: Record<string, number> = {};
    transcript.forEach((item: any) => {
      const id = item.speaker_id || "unknown";
      counts[id] = (counts[id] || 0) + 1;
    });
    const values = Object.values(counts) as number[];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stddev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
    const cv = mean > 0 ? stddev / mean : 1;
    participationScore = Math.max(0, Math.round(100 - cv * 80));
  } else if (speakers.length === 1) {
    participationScore = 60; // solo meeting
  }

  // Duration score (0-100): 30-60 min ideal
  let durationScore = 50;
  if (duration > 0) {
    const mins = duration / 60;
    if (mins >= 30 && mins <= 60) durationScore = 100;
    else if (mins >= 15 && mins < 30) durationScore = 75;
    else if (mins > 60 && mins <= 90) durationScore = 80;
    else if (mins > 90) durationScore = 55;
    else durationScore = 40;
  }

  // Action density (0-100): 1-4 items per 30 min is ideal
  let actionScore = 60;
  if (duration > 0) {
    const per30 = actionItems.length / (duration / 1800);
    if (per30 >= 1 && per30 <= 4) actionScore = 95;
    else if (per30 > 4 && per30 <= 7) actionScore = 75;
    else if (per30 > 7) actionScore = 50;
    else if (per30 > 0) actionScore = 70;
    else actionScore = 40;
  } else if (actionItems.length > 0) {
    actionScore = 75;
  }

  // Sentiment score
  const sentimentMap: Record<string, number> = {
    positive: 95, neutral: 70, mixed: 60, negative: 30,
  };
  const sentimentScore = sentimentMap[meeting.overall_sentiment?.toLowerCase()] ?? 70;

  // Completion rate of action items
  const completed = actionItems.filter((i: any) => i.status === "completed").length;
  const completionScore = actionItems.length > 0
    ? Math.round((completed / actionItems.length) * 100)
    : 70;

  const overall = Math.round(
    participationScore * 0.25 +
    durationScore * 0.20 +
    actionScore * 0.20 +
    sentimentScore * 0.20 +
    completionScore * 0.15,
  );

  return { overall, participationScore, durationScore, actionScore, sentimentScore, completionScore };
}

function ScoreBar({ label, score, description }: { label: string; score: number; description: string }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("transcript");
  const [currentTime, setCurrentTime] = useState(0);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => meetingsApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "processing" ? 5000 : false,
  });

  const handleExport = (type: "transcript" | "summary" | "markdown") => {
    if (!id) return;
    if (type === "transcript") {
      exportApi.exportTranscript(id);
    } else if (type === "summary") {
      exportApi.exportSummary(id);
    } else {
      exportApi.exportMarkdown(meeting);
    }
    toast({
      title: "Export started",
      description: "Your download will begin shortly.",
    });
  };

  const handleSeekToTime = (time: number) => {
    setCurrentTime(time);
    if (activeTab !== "transcript") {
      setActiveTab("transcript");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-6 py-4">
            <Skeleton className="h-8 w-64" />
          </div>
        </header>
        <div className="container mx-auto px-3 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Meeting not found</h2>
          <p className="text-muted-foreground mb-6">
            The meeting you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const actionItems = meeting.action_items || [];
  const decisions = meeting.decisions || [];
  const transcript = meeting.transcript || [];
  const speakers = meeting.speakers || [];
  const health = computeHealthScore(meeting);

  const filteredTranscript = transcriptSearch.trim()
    ? transcript.filter((item: any) =>
        item.text?.toLowerCase().includes(transcriptSearch.toLowerCase()),
      )
    : transcript;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{meeting.title}</h1>
                  {meeting.is_favorite && (
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatRelativeTime(meeting.created_at)}
                  </span>
                  {meeting.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(meeting.duration)}
                    </span>
                  )}
                  {speakers.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {speakers.length} speakers
                    </span>
                  )}
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status === "processing" && (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                    )}
                    {meeting.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => setAiChatOpen(true)}>
                <Bot className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/comparison")}>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Compare
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("transcript")}>
                <Download className="w-4 h-4 mr-2" />
                Transcript
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("summary")}>
                <Download className="w-4 h-4 mr-2" />
                Summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
                <FileDown className="w-4 h-4 mr-2" />
                Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied", description: "Meeting link copied to clipboard." });
                }}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-8">
        {/* Processing banner */}
        {meeting.status === "processing" && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">Processing your meeting…</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Transcription and AI analysis are in progress. This page will update automatically.
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{actionItems.length}</p>
                <p className="text-sm text-muted-foreground">Action Items</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{decisions.length}</p>
                <p className="text-sm text-muted-foreground">Decisions</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{speakers.length}</p>
                <p className="text-sm text-muted-foreground">Speakers</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">
                  {meeting.overall_sentiment || "Neutral"}
                </p>
                <p className="text-sm text-muted-foreground">Sentiment</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  health.overall >= 80
                    ? "bg-green-100 dark:bg-green-900"
                    : health.overall >= 60
                    ? "bg-yellow-100 dark:bg-yellow-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    health.overall >= 80
                      ? "text-green-600"
                      : health.overall >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.overall}</p>
                <p className="text-sm text-muted-foreground">Health Score</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {meeting.audio_url && (
              <AudioPlayer
                audioUrl={meeting.audio_url}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
                onSeek={setCurrentTime}
              />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="decisions">Decisions</TabsTrigger>
                <TabsTrigger value="speakers">Speakers</TabsTrigger>
                <TabsTrigger value="health">
                  <Heart className="w-3 h-3 mr-1" />
                  Health
                </TabsTrigger>
              </TabsList>

              {/* Transcript Tab */}
              <TabsContent value="transcript" className="mt-6">
                <Card className="p-6">
                  {/* Search within transcript */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transcript…"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="pl-9"
                    />
                    {transcriptSearch && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {filteredTranscript.length} result{filteredTranscript.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {transcript.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Transcript not available yet. It will appear here once the meeting is processed.
                      </p>
                    </div>
                  ) : filteredTranscript.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No results for "{transcriptSearch}"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTranscript.map((item: any, index: number) => {
                        const speaker = speakers.find((s: any) => s.id === item.speaker_id);
                        const speakerName = speaker?.custom_name || speaker?.name || "Unknown";
                        const speakerColor = speaker?.color || "#3b82f6";

                        return (
                          <div
                            key={item.id || index}
                            className="flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex-shrink-0">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{ backgroundColor: speakerColor }}
                              >
                                {speakerName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{speakerName}</span>
                                <button
                                  onClick={() => handleSeekToTime(item.start_time)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {Math.floor(item.start_time / 60)}:
                                  {String(Math.floor(item.start_time % 60)).padStart(2, "0")}
                                </button>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {highlightText(item.text, transcriptSearch)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-6">
                <Card className="p-6">
                  {meeting.summary ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {meeting.summary}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Summary not available yet.</p>
                    </div>
                  )}

                  {meeting.topics && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-semibold mb-3">Topics Discussed</h3>
                      <div className="flex flex-wrap gap-2">
                        {meeting.topics.split(",").map((topic: string) => (
                          <Badge key={topic} variant="secondary">
                            {topic.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Action Items Tab */}
              <TabsContent value="actions" className="mt-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Action Items</h3>
                    <Badge variant="secondary">
                      {actionItems.filter((i: any) => i.status !== "completed").length} pending
                    </Badge>
                  </div>

                  {actionItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No action items identified.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {actionItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <p className="font-medium mb-2">{item.text}</p>
                          <div className="flex items-center gap-3 text-sm">
                            {item.assignee && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <User className="w-3 h-3" />
                                {item.assignee}
                              </span>
                            )}
                            {item.due_date && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {item.priority && (
                              <Badge
                                className={
                                  item.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : item.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {item.priority}
                              </Badge>
                            )}
                            <Badge
                              className={
                                item.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Decisions Tab */}
              <TabsContent value="decisions" className="mt-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Key Decisions</h3>

                  {decisions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No key decisions recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {decisions.map((decision: any) => (
                        <div
                          key={decision.id}
                          className="p-4 rounded-lg border border-warning/20 bg-warning-light"
                        >
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-warning" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-2">{decision.text}</p>
                              {decision.reasoning && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {decision.reasoning}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Speakers Tab */}
              <TabsContent value="speakers" className="mt-6">
                <SpeakerManagement meetingId={id!} speakers={speakers} />
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="mt-6">
                <Card className="p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${
                        health.overall >= 80
                          ? "bg-green-500"
                          : health.overall >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {health.overall}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Meeting Health Score</h3>
                      <p className="text-muted-foreground text-sm">
                        {health.overall >= 80
                          ? "Excellent — highly productive meeting"
                          : health.overall >= 60
                          ? "Good — some areas to improve"
                          : "Needs attention — consider adjustments"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ScoreBar
                      label="Participation Balance"
                      score={health.participationScore}
                      description="How evenly speaking time was distributed across participants"
                    />
                    <ScoreBar
                      label="Duration Efficiency"
                      score={health.durationScore}
                      description="Meeting length vs. ideal range (30–60 min)"
                    />
                    <ScoreBar
                      label="Action Item Density"
                      score={health.actionScore}
                      description="Number of action items relative to meeting length"
                    />
                    <ScoreBar
                      label="Sentiment"
                      score={health.sentimentScore}
                      description="Overall tone and mood of the meeting"
                    />
                    <ScoreBar
                      label="Action Item Completion"
                      score={health.completionScore}
                      description={
                        actionItems.length === 0
                          ? "No action items to evaluate"
                          : `${actionItems.filter((i: any) => i.status === "completed").length} of ${actionItems.length} completed`
                      }
                    />
                  </div>

                  {meeting.agenda && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Agenda
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.agenda}</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <TagsAndCategory
              meetingId={id!}
              currentTags={meeting.tags}
              currentCategory={meeting.category}
              currentNotes={meeting.notes}
            />

            <Card className="p-6">
              <Comments meetingId={id!} userId={user?.id} />
            </Card>

            <Card className="p-6">
              <Highlights meetingId={id!} userId={user?.id} onSeek={handleSeekToTime} />
            </Card>
          </div>
        </div>
      </div>

      <AIChatDialog
        open={aiChatOpen}
        onOpenChange={setAiChatOpen}
        meetingId={id!}
        meetingTitle={meeting.title}
      />
      <BackToTop />
    </div>
  );
};

export default MeetingDetail;
