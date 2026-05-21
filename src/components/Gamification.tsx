import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Target,
  Zap,
  Star,
  Award,
  TrendingUp,
  Flame,
  CheckCircle2,
  Medal,
  Crown,
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  points: number;
  meetings: number;
  actionItemsCompleted: number;
  streak: number;
  trend: "up" | "down" | "same";
}

const Gamification = () => {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary", user?.id],
    queryFn: () => analyticsApi.getSummary(user?.id),
    enabled: !!user?.id,
  });

  const totalMeetings: number = summary?.meetings?.total ?? 0;
  const completedActions: number = summary?.actionItems?.completed ?? 0;
  const totalActions: number = summary?.actionItems?.total ?? 0;
  const completionRate: number = summary?.actionItems?.completionRate ?? 0;
  const totalDecisions: number = summary?.decisions?.total ?? 0;

  const achievements = useMemo<Achievement[]>(() => [
    {
      id: "first-meeting",
      name: "Getting Started",
      description: "Record your first meeting",
      icon: <Trophy className="w-6 h-6" />,
      progress: Math.min(totalMeetings, 1),
      target: 1,
      unlocked: totalMeetings >= 1,
      unlockedAt: totalMeetings >= 1 ? new Date().toISOString() : undefined,
      rarity: "common",
      points: 10,
    },
    {
      id: "meetings-10",
      name: "Regular Recorder",
      description: "Record 10 meetings",
      icon: <Award className="w-6 h-6" />,
      progress: Math.min(totalMeetings, 10),
      target: 10,
      unlocked: totalMeetings >= 10,
      unlockedAt: totalMeetings >= 10 ? new Date().toISOString() : undefined,
      rarity: "common",
      points: 30,
    },
    {
      id: "meetings-50",
      name: "Meeting Maven",
      description: "Record 50 meetings",
      icon: <Award className="w-6 h-6" />,
      progress: Math.min(totalMeetings, 50),
      target: 50,
      unlocked: totalMeetings >= 50,
      unlockedAt: totalMeetings >= 50 ? new Date().toISOString() : undefined,
      rarity: "rare",
      points: 75,
    },
    {
      id: "action-items-10",
      name: "Task Tackler",
      description: "Complete 10 action items",
      icon: <CheckCircle2 className="w-6 h-6" />,
      progress: Math.min(completedActions, 10),
      target: 10,
      unlocked: completedActions >= 10,
      unlockedAt: completedActions >= 10 ? new Date().toISOString() : undefined,
      rarity: "common",
      points: 25,
    },
    {
      id: "action-items-50",
      name: "Action Hero",
      description: "Complete 50 action items",
      icon: <Target className="w-6 h-6" />,
      progress: Math.min(completedActions, 50),
      target: 50,
      unlocked: completedActions >= 50,
      unlockedAt: completedActions >= 50 ? new Date().toISOString() : undefined,
      rarity: "rare",
      points: 80,
    },
    {
      id: "action-items-100",
      name: "Productivity Pro",
      description: "Complete 100 action items",
      icon: <Target className="w-6 h-6" />,
      progress: Math.min(completedActions, 100),
      target: 100,
      unlocked: completedActions >= 100,
      unlockedAt: completedActions >= 100 ? new Date().toISOString() : undefined,
      rarity: "epic",
      points: 150,
    },
    {
      id: "high-completion",
      name: "Closer",
      description: "Achieve 80%+ action item completion rate",
      icon: <Star className="w-6 h-6" />,
      progress: Math.min(completionRate, 80),
      target: 80,
      unlocked: completionRate >= 80,
      unlockedAt: completionRate >= 80 ? new Date().toISOString() : undefined,
      rarity: "epic",
      points: 100,
    },
    {
      id: "decision-maker-10",
      name: "Decision Maker",
      description: "Document 10 key decisions",
      icon: <Target className="w-6 h-6" />,
      progress: Math.min(totalDecisions, 10),
      target: 10,
      unlocked: totalDecisions >= 10,
      unlockedAt: totalDecisions >= 10 ? new Date().toISOString() : undefined,
      rarity: "rare",
      points: 40,
    },
    {
      id: "decision-maker-50",
      name: "Strategic Thinker",
      description: "Document 50 key decisions",
      icon: <Crown className="w-6 h-6" />,
      progress: Math.min(totalDecisions, 50),
      target: 50,
      unlocked: totalDecisions >= 50,
      unlockedAt: totalDecisions >= 50 ? new Date().toISOString() : undefined,
      rarity: "epic",
      points: 120,
    },
    {
      id: "meetings-100",
      name: "Meeting Legend",
      description: "Record 100 meetings",
      icon: <Crown className="w-6 h-6" />,
      progress: Math.min(totalMeetings, 100),
      target: 100,
      unlocked: totalMeetings >= 100,
      unlockedAt: totalMeetings >= 100 ? new Date().toISOString() : undefined,
      rarity: "legendary",
      points: 500,
    },
  ], [totalMeetings, completedActions, completionRate, totalDecisions]);

  const totalPoints = useMemo(
    () => achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0),
    [achievements]
  );
  const level = useMemo(() => Math.max(1, Math.floor(totalPoints / 100) + 1), [totalPoints]);
  const pointsInCurrentLevel = totalPoints % 100;
  const nextLevelPoints = level * 100;

  const leaderboard: LeaderboardEntry[] = useMemo(() => [
    { rank: 1, userId: "user-1", name: "Sarah Chen", points: 2450, meetings: 87, actionItemsCompleted: 156, streak: 21, trend: "same" },
    { rank: 2, userId: "user-2", name: "Mike Johnson", points: 1980, meetings: 72, actionItemsCompleted: 134, streak: 14, trend: "up" },
    { rank: 3, userId: "current-user", name: user?.name ?? "You", points: totalPoints, meetings: totalMeetings, actionItemsCompleted: completedActions, streak: 0, trend: "up" },
    { rank: 4, userId: "user-4", name: "Emily Rodriguez", points: 1120, meetings: 41, actionItemsCompleted: 78, streak: 12, trend: "down" },
    { rank: 5, userId: "user-5", name: "David Kim", points: 890, meetings: 38, actionItemsCompleted: 62, streak: 5, trend: "up" },
  ], [user?.name, totalPoints, totalMeetings, completedActions]);

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-300";
      case "rare":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
      case "legendary":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  const progressToNextLevel = (pointsInCurrentLevel / 100) * 100;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Achievement Center</h2>
              <p className="text-sm text-muted-foreground">
                Track your progress and compete with your team
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{level}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress to Level {level + 1}</span>
                <span>{pointsInCurrentLevel} / 100</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-2 border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <p className="text-sm text-muted-foreground">Meetings</p>
              </div>
              <p className="text-3xl font-bold">{totalMeetings}</p>
              <p className="text-xs text-muted-foreground">recorded</p>
            </div>
            <div className="text-2xl">🎙️</div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Actions Done</p>
              </div>
              <p className="text-3xl font-bold">{completedActions}</p>
              <p className="text-xs text-muted-foreground">of {totalActions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Achievements</p>
              </div>
              <p className="text-3xl font-bold">{unlockedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">of {achievements.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Team Leaderboard
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">This Month</Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">Sample — multi-user coming soon</Badge>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <Card
                  key={entry.userId}
                  className={`p-4 ${
                    entry.userId === "current-user"
                      ? "border-2 border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(entry.rank) || (
                        <span className="text-xl font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{entry.name}</p>
                        {entry.userId === "current-user" && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                        {entry.trend === "up" && (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{entry.meetings} meetings</span>
                        <span>{entry.actionItemsCompleted} actions</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak} days
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievements
        </h3>

        {/* Unlocked */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Unlocked ({unlockedAchievements.length})
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlockedAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-200 dark:border-yellow-900"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
                      {achievement.icon}
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-1">{achievement.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="w-3 h-3" />
                      +{achievement.points}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Locked */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Locked ({lockedAchievements.length})
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedAchievements.map((achievement) => (
              <Card key={achievement.id} className="p-4 opacity-60">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      {achievement.icon}
                    </div>
                    <Badge className={getRarityColor(achievement.rarity)} variant="outline">
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-1">{achievement.name}</h5>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>
                        {achievement.progress} / {achievement.target}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.target) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {achievement.target - achievement.progress} more to unlock
                    </span>
                    <Badge variant="outline" className="gap-1">
                      <Zap className="w-3 h-3" />
                      +{achievement.points}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          🏆 <strong>Level Up!</strong> Complete achievements to earn points and climb the
          leaderboard. Maintain your streak by recording meetings daily. Compete with your team
          and unlock exclusive badges. The more you engage, the more you earn!
        </p>
      </Card>
    </div>
  );
};

export default Gamification;
