import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mic,
  ArrowRight,
  Filter,
} from "lucide-react";
import { actionItemsApi, meetingsApi } from "@/lib/api";
import { getPriorityColor, getStatusColor, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ActionItemsDashboard = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch action items stats
  const { data: stats } = useQuery({
    queryKey: ["action-items-stats"],
    queryFn: () => actionItemsApi.getStats(),
  });

  // Fetch kanban data
  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ["action-items-kanban"],
    queryFn: () => actionItemsApi.getKanban(),
  });

  // Update action item mutation
  const updateMutation = useMutation({
    mutationFn: ({ meetingId, actionId, data }: any) =>
      meetingsApi.updateActionItem(meetingId, actionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["action-items-stats"] });
      toast({
        title: "Action item updated",
        description: "The action item has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (item: any, newStatus: string) => {
    updateMutation.mutate({
      meetingId: item.meeting_id,
      actionId: item.id,
      data: { status: newStatus },
    });
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );

  const ActionItemCard = ({ item }: { item: any }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/meeting/${item.meeting_id}`}
            className="text-sm font-medium text-primary hover:underline mb-1 block"
          >
            {item.meeting_title}
          </Link>
          <p className="text-foreground mb-2">{item.text}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className={getPriorityColor(item.priority || "medium")}>
              {item.priority || "medium"}
            </Badge>

            {item.assignee && (
              <span className="text-muted-foreground">Assigned to: {item.assignee}</span>
            )}

            {item.due_date && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.due_date).toLocaleDateString()}
              </span>
            )}

            <span className="text-muted-foreground">
              {formatRelativeTime(item.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {item.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(item, "in_progress")}
            >
              Start
            </Button>
          )}
          {item.status === "in_progress" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(item, "completed")}
            >
              Complete
            </Button>
          )}
          {item.status === "completed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(item, "pending")}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">MeetingMind</h1>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

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

      <div className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Action Items</h1>
          <p className="text-muted-foreground">
            Manage all your action items across meetings in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={CheckSquare}
            label="Total Items"
            value={stats?.total || 0}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats?.pending || 0}
            color="bg-gray-100 text-gray-800"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats?.completed || 0}
            color="bg-green-100 text-green-800"
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={stats?.overdue || 0}
            color="bg-red-100 text-red-800"
          />
        </div>

        {/* Kanban Board */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold">
                    Pending ({kanbanData?.pending?.length || 0})
                  </h3>
                </div>
                <div className="space-y-3">
                  {kanbanData?.pending?.map((item: any) => (
                    <ActionItemCard key={item.id} item={item} />
                  ))}
                  {(!kanbanData?.pending || kanbanData.pending.length === 0) && (
                    <Card className="p-8 text-center text-muted-foreground">
                      No pending items
                    </Card>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">
                    In Progress ({kanbanData?.in_progress?.length || 0})
                  </h3>
                </div>
                <div className="space-y-3">
                  {kanbanData?.in_progress?.map((item: any) => (
                    <ActionItemCard key={item.id} item={item} />
                  ))}
                  {(!kanbanData?.in_progress || kanbanData.in_progress.length === 0) && (
                    <Card className="p-8 text-center text-muted-foreground">
                      No items in progress
                    </Card>
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold">
                    Completed ({kanbanData?.completed?.length || 0})
                  </h3>
                </div>
                <div className="space-y-3">
                  {kanbanData?.completed?.map((item: any) => (
                    <ActionItemCard key={item.id} item={item} />
                  ))}
                  {(!kanbanData?.completed || kanbanData.completed.length === 0) && (
                    <Card className="p-8 text-center text-muted-foreground">
                      No completed items
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <div className="space-y-3">
              {[
                ...(kanbanData?.pending || []),
                ...(kanbanData?.in_progress || []),
                ...(kanbanData?.completed || []),
              ].map((item: any) => (
                <ActionItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActionItemsDashboard;
