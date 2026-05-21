import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic, Search, Clock, Users, TrendingUp,
  MoreVertical, Play, FileText, CheckSquare, AlertCircle,
  Filter, Star, Trash2, Download, Bell, Menu, Zap, Link as LinkIcon,
  Shield, Trophy, BarChart3, Database
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadDialog } from "@/components/UploadDialog";
import RecordingDialog from "@/components/RecordingDialog";
import { meetingsApi, analyticsApi, exportApi, seedApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/utils";
import BackToTop from "@/components/BackToTop";
import OnboardingModal from "@/components/OnboardingModal";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; meetingId?: string; isBulk?: boolean }>({ open: false });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch meetings with filters
  const { data: meetingsData, isLoading: meetingsLoading, error: meetingsError } = useQuery({
    queryKey: ['meetings', categoryFilter, statusFilter, favoriteFilter, sortBy, sortOrder],
    queryFn: () => meetingsApi.getAll({
      limit: 100,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      isFavorite: favoriteFilter !== null ? favoriteFilter : undefined,
      sortBy,
      sortOrder,
    }),
    refetchInterval: (query) => {
      const meetings = query.state.data?.meetings || [];
      return meetings.some((m: any) => m.status === "processing") ? 5000 : false;
    },
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.getSummary()
  });

  const allMeetings = meetingsData?.meetings || [];
  const meetings = searchQuery.trim()
    ? allMeetings.filter((m: any) => {
        const q = searchQuery.toLowerCase();
        return (
          m.title?.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.tags?.toLowerCase().includes(q)
        );
      })
    : allMeetings;

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (meetingId: string) => meetingsApi.toggleFavorite(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: "Favorite updated",
        description: "Meeting favorite status has been updated.",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (meetingId: string) => meetingsApi.delete(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: "Meeting deleted",
        description: "The meeting has been permanently deleted.",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (meetingIds: string[]) => meetingsApi.bulkDelete(meetingIds),
    onSuccess: () => {
      setSelectedMeetings([]);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast({
        title: "Meetings deleted",
        description: `${selectedMeetings.length} meetings have been deleted.`,
      });
    },
  });

  // Seed demo data mutation
  const seedMutation = useMutation({
    mutationFn: () => seedApi.seed(),
    onSuccess: (data) => {
      if (data.seeded) {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        toast({ title: "Demo data loaded!", description: `Added ${data.meetings.length} sample meetings to explore.` });
      } else {
        toast({ title: "Demo data already loaded", description: "Your account already has sample meetings." });
      }
    },
    onError: () => {
      toast({ title: "Failed to load demo data", description: "Make sure the backend server is running.", variant: "destructive" });
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent, meetingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate(meetingId);
  };

  const handleDelete = (e: React.MouseEvent, meetingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialog({ open: true, meetingId, isBulk: false });
  };

  const handleBulkDelete = () => {
    setDeleteDialog({ open: true, isBulk: true });
  };

  const handleExport = (e: React.MouseEvent, meetingId: string, type: "transcript" | "summary") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "transcript") {
      exportApi.exportTranscript(meetingId);
    } else {
      exportApi.exportSummary(meetingId);
    }
    toast({
      title: "Export started",
      description: "Your download will begin shortly.",
    });
  };

  const toggleMeetingSelection = (meetingId: string) => {
    setSelectedMeetings(prev =>
      prev.includes(meetingId)
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMeetings.length === meetings.length) {
      setSelectedMeetings([]);
    } else {
      setSelectedMeetings(meetings.map((m: any) => m.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-success-light text-success border-success/20',
      processing: 'bg-warning-light text-warning border-warning/20',
      failed: 'bg-destructive/10 text-destructive border-destructive/20',
      uploading: 'bg-primary-light text-primary border-primary/20'
    };

    return statusColors[status as keyof typeof statusColors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">MeetingMind</h1>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Features Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/templates")}>
                    <Zap className="w-4 h-4 mr-2" />
                    Smart Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/integrations")}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Integrations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/privacy")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy & Compliance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/achievements")}>
                    <Trophy className="w-4 h-4 mr-2" />
                    Achievements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/analytics")}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Visual Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={() => navigate("/action-items")}
              >
                <CheckSquare className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={() => navigate("/search")}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setRecordingDialogOpen(true)}
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Record Meeting</span>
                <span className="sm:hidden">Record</span>
              </Button>
              <UploadDialog />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Meetings</p>
                {analyticsLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{analytics?.meetings?.total || meetings.length}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Action Items</p>
                {analyticsLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{analytics?.actionItems?.total || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Time</p>
                {analyticsLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold">{analytics?.totalTime?.formatted || '0h 0m'}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-light flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                {analyticsLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{analytics?.actionItems?.completionRate || 0}%</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search meetings, topics, decisions, action items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="standup">Standup</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="retrospective">Retrospective</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="uploading">Uploading</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={favoriteFilter === true ? "default" : "outline"}
                size="sm"
                onClick={() => setFavoriteFilter(favoriteFilter === true ? null : true)}
              >
                <Star className={`w-4 h-4 mr-2 ${favoriteFilter === true ? "fill-current" : ""}`} />
                Favorites
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="speakers_count">Speakers</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            {selectedMeetings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedMeetings.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Meetings</h2>

          {/* Loading State */}
          {meetingsLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 border-border">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {/* Empty State — shown when no meetings OR backend unreachable */}
          {!meetingsLoading && (meetingsError || meetings.length === 0) && (
            <Card className="p-12 border-border">
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
                  <Mic className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload or record your first meeting to get started
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <UploadDialog trigger={
                      <Button variant="hero">Upload Your First Meeting</Button>
                    } />
                    <Button
                      variant="outline"
                      onClick={() => seedMutation.mutate()}
                      disabled={seedMutation.isPending}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      {seedMutation.isPending ? "Loading…" : "Load Demo Data"}
                    </Button>
                  </div>
                </div>
              </div>
              {meetingsError && meetingsError.message === 'Failed to fetch' && (
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Backend server is not running — start it to enable uploads and processing.
                </p>
              )}
            </Card>
          )}

          {/* Meetings Grid */}
          {!meetingsLoading && !meetingsError && meetings.length > 0 && meetings.map((meeting: any) => (
            <Card key={meeting.id} className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group relative">
              {/* Delete Button - Top Right Corner */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
                onClick={(e) => handleDelete(e, meeting.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 pr-8">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3
                              className="text-lg font-semibold group-hover:text-primary transition-colors cursor-pointer inline"
                              onClick={() => navigate(`/meeting/${meeting.id}`)}
                            >
                              {meeting.title}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleFavorite(e, meeting.id);
                              }}
                              className="inline-flex items-center hover:scale-110 transition-transform cursor-pointer"
                              aria-label={meeting.is_favorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star className={`w-4 h-4 transition-all ${meeting.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-gray-400"}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
                            </span>
                            {meeting.duration && (
                              <span>{formatDuration(meeting.duration)}</span>
                            )}
                            {meeting.speakers_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {meeting.speakers_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <Badge className={getStatusBadge(meeting.status)}>
                          {meeting.status}
                        </Badge>

                        {meeting.category && (
                          <Badge variant="outline">
                            {meeting.category}
                          </Badge>
                        )}

                        {meeting.action_items_count > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {meeting.action_items_count} actions
                          </Badge>
                        )}

                        {meeting.decisions_count > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="w-3 h-3" />
                            {meeting.decisions_count} decisions
                          </Badge>
                        )}

                        {meeting.overall_sentiment && (
                          <Badge
                            className={
                              meeting.overall_sentiment === "positive"
                                ? "bg-success-light text-success border-success/20"
                                : meeting.overall_sentiment === "negative"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {meeting.overall_sentiment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meeting/${meeting.id}`);
                    }}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleExport(e, meeting.id, "transcript")}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Transcript
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleExport(e, meeting.id, "summary")}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Summary
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleToggleFavorite(e, meeting.id)}>
                      <Star className="w-4 h-4 mr-2" />
                      {meeting.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => handleDelete(e, meeting.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recording Dialog */}
      <RecordingDialog
        open={recordingDialogOpen}
        onOpenChange={setRecordingDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.isBulk
                ? `Delete ${selectedMeetings.length} meetings?`
                : "Delete this meeting?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The recording and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialog.isBulk) {
                  bulkDeleteMutation.mutate(selectedMeetings);
                } else if (deleteDialog.meetingId) {
                  deleteMutation.mutate(deleteDialog.meetingId);
                }
                setDeleteDialog({ open: false });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BackToTop />
      <OnboardingModal />
    </div>
  );
};

export default Dashboard;
