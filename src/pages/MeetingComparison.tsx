import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  ArrowLeftRight,
  Clock,
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { meetingsApi, comparisonsApi } from "@/lib/api";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MeetingComparison = () => {
  const [meeting1Id, setMeeting1Id] = useState<string>("");
  const [meeting2Id, setMeeting2Id] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all meetings for selection
  const { data: meetingsData } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingsApi.getAll({ limit: 100 }),
  });

  const meetings = meetingsData?.meetings || [];

  // Comparison mutation
  const compareMutation = useMutation({
    mutationFn: () =>
      comparisonsApi.compare(meeting1Id, meeting2Id, user?.id),
    onError: () => {
      toast({
        title: "Comparison failed",
        description: "Failed to compare meetings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompare = () => {
    if (!meeting1Id || !meeting2Id) {
      toast({
        title: "Select meetings",
        description: "Please select two meetings to compare.",
        variant: "destructive",
      });
      return;
    }
    if (meeting1Id === meeting2Id) {
      toast({
        title: "Different meetings required",
        description: "Please select two different meetings.",
        variant: "destructive",
      });
      return;
    }
    compareMutation.mutate();
  };

  const comparison = compareMutation.data;
  const meeting1 = comparison?.meeting1;
  const meeting2 = comparison?.meeting2;

  const ComparisonMetric = ({
    label,
    value1,
    value2,
    icon: Icon,
  }: {
    label: string;
    value1: any;
    value2: any;
    icon: any;
  }) => (
    <div className="grid grid-cols-3 gap-4 items-center py-4 border-b">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-center">{value1}</div>
      <div className="text-center">{value2}</div>
    </div>
  );

  const ComparisonSection = ({
    title,
    items1,
    items2,
  }: {
    title: string;
    items1: string[];
    items2: string[];
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {items1.map((item, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg text-sm">
              {item}
            </div>
          ))}
          {items1.length === 0 && (
            <p className="text-sm text-muted-foreground italic">None</p>
          )}
        </div>
        <div className="space-y-2">
          {items2.map((item, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg text-sm">
              {item}
            </div>
          ))}
          {items2.length === 0 && (
            <p className="text-sm text-muted-foreground italic">None</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">MeetingMind</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meeting Comparison</h1>
          <p className="text-muted-foreground">
            Compare two meetings side by side to analyze differences and similarities
          </p>
        </div>

        {/* Meeting Selection */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Meeting</label>
              <Select value={meeting1Id} onValueChange={setMeeting1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a meeting" />
                </SelectTrigger>
                <SelectContent>
                  {meetings.map((meeting: any) => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      {meeting.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Second Meeting</label>
              <Select value={meeting2Id} onValueChange={setMeeting2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a meeting" />
                </SelectTrigger>
                <SelectContent>
                  {meetings.map((meeting: any) => (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      {meeting.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            onClick={handleCompare}
            disabled={
              !meeting1Id || !meeting2Id || compareMutation.isPending
            }
          >
            {compareMutation.isPending ? (
              <>
                <Skeleton className="w-4 h-4 mr-2" />
                Comparing...
              </>
            ) : (
              "Compare Meetings"
            )}
          </Button>
        </Card>

        {/* Comparison Results */}
        {compareMutation.isPending && (
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Card>
        )}

        {compareMutation.isError && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Comparison Failed
                </h3>
                <p className="text-sm text-muted-foreground">
                  Failed to compare meetings. Please try again.
                </p>
              </div>
            </div>
          </Card>
        )}

        {comparison && meeting1 && meeting2 && (
          <div className="space-y-6">
            {/* Meeting Headers */}
            <div className="grid grid-cols-3 gap-4">
              <div></div>
              <Card className="p-4">
                <Link
                  to={`/meeting/${meeting1.id}`}
                  className="text-center block"
                >
                  <h3 className="font-semibold truncate hover:text-primary">
                    {meeting1.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(meeting1.created_at)}
                  </p>
                </Link>
              </Card>
              <Card className="p-4">
                <Link
                  to={`/meeting/${meeting2.id}`}
                  className="text-center block"
                >
                  <h3 className="font-semibold truncate hover:text-primary">
                    {meeting2.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(meeting2.created_at)}
                  </p>
                </Link>
              </Card>
            </div>

            {/* Key Metrics Comparison */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Key Metrics</h2>
              <div className="space-y-2">
                <ComparisonMetric
                  label="Duration"
                  value1={formatDuration(meeting1.duration)}
                  value2={formatDuration(meeting2.duration)}
                  icon={Clock}
                />
                <ComparisonMetric
                  label="Speakers"
                  value1={meeting1.speakers_count || 0}
                  value2={meeting2.speakers_count || 0}
                  icon={Users}
                />
                <ComparisonMetric
                  label="Action Items"
                  value1={meeting1.action_items_count || 0}
                  value2={meeting2.action_items_count || 0}
                  icon={CheckSquare}
                />
                <ComparisonMetric
                  label="Decisions"
                  value1={meeting1.decisions_count || 0}
                  value2={meeting2.decisions_count || 0}
                  icon={FileText}
                />
                <ComparisonMetric
                  label="Sentiment"
                  value1={
                    <Badge
                      className={
                        meeting1.overall_sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : meeting1.overall_sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {meeting1.overall_sentiment || "neutral"}
                    </Badge>
                  }
                  value2={
                    <Badge
                      className={
                        meeting2.overall_sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : meeting2.overall_sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {meeting2.overall_sentiment || "neutral"}
                    </Badge>
                  }
                  icon={TrendingUp}
                />
              </div>
            </Card>

            {/* Summary Comparison */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    {meeting1.summary || "No summary available"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    {meeting2.summary || "No summary available"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Topics Comparison */}
            {(meeting1.topics || meeting2.topics) && (
              <Card className="p-6">
                <ComparisonSection
                  title="Topics Discussed"
                  items1={meeting1.topics ? meeting1.topics.split(",") : []}
                  items2={meeting2.topics ? meeting2.topics.split(",") : []}
                />
              </Card>
            )}

            {/* Action Items Comparison */}
            {(meeting1.action_items?.length > 0 ||
              meeting2.action_items?.length > 0) && (
              <Card className="p-6">
                <ComparisonSection
                  title="Action Items"
                  items1={
                    meeting1.action_items?.map((item: any) => item.text) || []
                  }
                  items2={
                    meeting2.action_items?.map((item: any) => item.text) || []
                  }
                />
              </Card>
            )}

            {/* Decisions Comparison */}
            {(meeting1.decisions?.length > 0 ||
              meeting2.decisions?.length > 0) && (
              <Card className="p-6">
                <ComparisonSection
                  title="Key Decisions"
                  items1={
                    meeting1.decisions?.map((item: any) => item.text) || []
                  }
                  items2={
                    meeting2.decisions?.map((item: any) => item.text) || []
                  }
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingComparison;
