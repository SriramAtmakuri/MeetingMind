import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import VisualAnalytics from "@/components/VisualAnalytics";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Clock,
  CheckSquare,
  Mic,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const AnalyticsPage = () => {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary", user?.id],
    queryFn: () => analyticsApi.getSummary(user?.id),
    enabled: !!user?.id,
  });

  const { data: trends } = useQuery({
    queryKey: ["analytics-trends", user?.id],
    queryFn: () => analyticsApi.getTrends(user?.id, 30),
    enabled: !!user?.id,
  });

  const stats = [
    {
      label: "Total Meetings",
      value: summary?.meetings?.total ?? "—",
      icon: <Mic className="w-5 h-5" />,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Time in Meetings",
      value: summary?.totalTime?.formatted ?? "—",
      icon: <Clock className="w-5 h-5" />,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "Action Items",
      value: summary?.actionItems?.total ?? "—",
      icon: <CheckSquare className="w-5 h-5" />,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      sub: summary?.actionItems?.completionRate != null
        ? `${summary.actionItems.completionRate}% completed`
        : undefined,
    },
    {
      label: "Completion Rate",
      value: summary?.actionItems?.completionRate != null
        ? `${summary.actionItems.completionRate}%`
        : "—",
      icon:
        (summary?.actionItems?.completionRate ?? 0) >= 50 ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <TrendingDown className="w-5 h-5" />
        ),
      color:
        (summary?.actionItems?.completionRate ?? 0) >= 50
          ? "text-emerald-500"
          : "text-red-500",
      bg:
        (summary?.actionItems?.completionRate ?? 0) >= 50
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "bg-red-50 dark:bg-red-950/30",
    },
  ];

  const trendData: { date: string; meetings_count: number }[] =
    trends?.data ?? [];

  const maxCount = Math.max(...trendData.map((d) => d.meetings_count), 1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Your meeting activity and insights
            </p>
          </div>
        </div>

        {/* Real stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="space-y-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    {stat.sub && (
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Meetings trend (last 30 days) */}
        {trendData.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Meetings — Last 30 Days</h2>
              <Badge variant="secondary">{trendData.length} active days</Badge>
            </div>
            <div className="flex items-end gap-1 h-24">
              {trendData.slice(-30).map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-colors cursor-default"
                  style={{ height: `${(d.meetings_count / maxCount) * 100}%`, minHeight: 4 }}
                  title={`${d.date}: ${d.meetings_count} meeting${d.meetings_count !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{trendData[0]?.date}</span>
              <span>{trendData[trendData.length - 1]?.date}</span>
            </div>
          </Card>
        )}

        {/* Visual analytics section */}
        <VisualAnalytics />
      </div>
    </div>
  );
};

export default AnalyticsPage;
