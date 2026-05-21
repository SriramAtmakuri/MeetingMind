import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  MessageCircle,
  Smile,
  Frown,
  Meh,
  Users,
  Clock,
  Target,
} from "lucide-react";

interface WordCloudItem {
  text: string;
  value: number;
  sentiment?: "positive" | "negative" | "neutral";
}

interface SpeakerMetric {
  id: string;
  name: string;
  talkTime: number; // seconds
  percentage: number;
  segments: number;
  avgSegmentLength: number;
  sentiment: "positive" | "neutral" | "negative";
  color: string;
}

interface SentimentPoint {
  timestamp: number;
  sentiment: number; // -1 to 1
  text: string;
  speaker: string;
}

interface DecisionNode {
  id: string;
  decision: string;
  reasoning: string[];
  alternatives: string[];
  outcome: "approved" | "rejected" | "deferred";
  timestamp: number;
}

const VisualAnalytics = ({ meetingId }: { meetingId?: string }) => {
  const [selectedView, setSelectedView] = useState<"wordcloud" | "speakers" | "sentiment" | "decisions">("wordcloud");
  const [timeRange, setTimeRange] = useState<"all" | "recent">("all");

  // Mock data
  const wordCloudData: WordCloudItem[] = [
    { text: "mobile", value: 45, sentiment: "positive" },
    { text: "development", value: 38, sentiment: "neutral" },
    { text: "budget", value: 32, sentiment: "negative" },
    { text: "timeline", value: 28, sentiment: "neutral" },
    { text: "users", value: 25, sentiment: "positive" },
    { text: "features", value: 22, sentiment: "positive" },
    { text: "testing", value: 20, sentiment: "neutral" },
    { text: "design", value: 18, sentiment: "positive" },
    { text: "performance", value: 16, sentiment: "negative" },
    { text: "deadline", value: 15, sentiment: "negative" },
    { text: "quality", value: 14, sentiment: "positive" },
    { text: "team", value: 12, sentiment: "positive" },
    { text: "resources", value: 11, sentiment: "negative" },
    { text: "stakeholders", value: 10, sentiment: "neutral" },
    { text: "requirements", value: 9, sentiment: "neutral" },
    { text: "risks", value: 8, sentiment: "negative" },
  ];

  const speakerMetrics: SpeakerMetric[] = [
    {
      id: "s1",
      name: "Sarah Chen",
      talkTime: 720,
      percentage: 35,
      segments: 24,
      avgSegmentLength: 30,
      sentiment: "positive",
      color: "#3b82f6",
    },
    {
      id: "s2",
      name: "Mike Johnson",
      talkTime: 620,
      percentage: 30,
      segments: 20,
      avgSegmentLength: 31,
      sentiment: "neutral",
      color: "#10b981",
    },
    {
      id: "s3",
      name: "Emily Rodriguez",
      talkTime: 410,
      percentage: 20,
      segments: 15,
      avgSegmentLength: 27,
      sentiment: "positive",
      color: "#8b5cf6",
    },
    {
      id: "s4",
      name: "David Kim",
      talkTime: 310,
      percentage: 15,
      segments: 12,
      avgSegmentLength: 26,
      sentiment: "neutral",
      color: "#f59e0b",
    },
  ];

  const sentimentJourney: SentimentPoint[] = [
    { timestamp: 0, sentiment: 0.6, text: "Great progress on mobile", speaker: "Sarah" },
    { timestamp: 300, sentiment: 0.7, text: "Team is doing amazing", speaker: "Mike" },
    { timestamp: 600, sentiment: -0.3, text: "Budget concerns", speaker: "Emily" },
    { timestamp: 900, sentiment: -0.5, text: "Timeline is tight", speaker: "David" },
    { timestamp: 1200, sentiment: 0.2, text: "We can make it work", speaker: "Sarah" },
    { timestamp: 1500, sentiment: 0.5, text: "Good solution proposed", speaker: "Mike" },
    { timestamp: 1800, sentiment: 0.8, text: "Excellent decision", speaker: "All" },
  ];

  const decisionTree: DecisionNode[] = [
    {
      id: "d1",
      decision: "Proceed with mobile-first approach",
      reasoning: [
        "60% of traffic from mobile devices",
        "Competitor analysis shows mobile preference",
        "Team has mobile expertise",
      ],
      alternatives: [
        "Desktop-first approach",
        "Simultaneous development",
      ],
      outcome: "approved",
      timestamp: 450,
    },
    {
      id: "d2",
      decision: "Allocate additional $50k for Q2",
      reasoning: [
        "Initial estimates were conservative",
        "Critical features require more resources",
        "ROI justifies investment",
      ],
      alternatives: [
        "Delay features to next quarter",
        "Reduce scope",
      ],
      outcome: "approved",
      timestamp: 1200,
    },
    {
      id: "d3",
      decision: "Hire two additional developers",
      reasoning: [
        "Current team at capacity",
        "Project timeline is aggressive",
      ],
      alternatives: [
        "Extend timeline",
        "Use contractors",
      ],
      outcome: "deferred",
      timestamp: 1650,
    },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentIcon = (sentiment: SpeakerMetric["sentiment"] | string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="w-4 h-4 text-green-500" />;
      case "negative":
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getDecisionColor = (outcome: DecisionNode["outcome"]) => {
    switch (outcome) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300";
      case "deferred":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Visual Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Advanced visualizations for meeting insights
              </p>
            </div>
          </div>
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wordcloud">Word Cloud</SelectItem>
              <SelectItem value="speakers">Speaker Analytics</SelectItem>
              <SelectItem value="sentiment">Sentiment Journey</SelectItem>
              <SelectItem value="decisions">Decision Tree</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Word Cloud */}
      {selectedView === "wordcloud" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Topic Word Cloud
              </h3>
              <Badge variant="secondary">{wordCloudData.length} keywords</Badge>
            </div>

            <div className="relative h-[400px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden p-8">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {wordCloudData.map((item, index) => {
                  const fontSize = Math.max(12, Math.min(48, item.value));
                  const opacity = Math.max(0.5, item.value / 50);

                  let color = "text-gray-600 dark:text-gray-400";
                  if (item.sentiment === "positive") color = "text-green-600 dark:text-green-400";
                  if (item.sentiment === "negative") color = "text-red-600 dark:text-red-400";

                  return (
                    <span
                      key={index}
                      className={`font-bold cursor-pointer hover:scale-110 transition-transform ${color}`}
                      style={{
                        fontSize: `${fontSize}px`,
                        opacity,
                      }}
                      title={`Mentioned ${item.value} times`}
                    >
                      {item.text}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>Positive Context</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded" />
                <span>Neutral Context</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>Negative Context</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Speaker Analytics */}
      {selectedView === "speakers" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Speaker Time Distribution
              </h3>

              <div className="space-y-4">
                {speakerMetrics.map((speaker) => (
                  <div key={speaker.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: speaker.color }}
                        >
                          {speaker.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{speaker.segments} segments</span>
                            <span>•</span>
                            <span>{formatTime(speaker.talkTime)}</span>
                            <span>•</span>
                            {getSentimentIcon(speaker.sentiment)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{speaker.percentage}%</p>
                      </div>
                    </div>

                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{
                          width: `${speaker.percentage}%`,
                          backgroundColor: speaker.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Talk Time Balance</h4>
              <div className="relative w-full aspect-square max-w-[250px] mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {speakerMetrics.map((speaker, index) => {
                    const previousPercentages = speakerMetrics
                      .slice(0, index)
                      .reduce((sum, s) => sum + s.percentage, 0);
                    const startAngle = (previousPercentages / 100) * 360;
                    const endAngle = ((previousPercentages + speaker.percentage) / 100) * 360;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);

                    const largeArc = speaker.percentage > 50 ? 1 : 0;

                    return (
                      <path
                        key={speaker.id}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={speaker.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{speakerMetrics.length}</p>
                    <p className="text-sm text-muted-foreground">Speakers</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Participation Metrics</h4>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Most Active</p>
                  <p className="text-lg font-semibold">{speakerMetrics[0].name}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Balance Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">78%</p>
                    <Badge variant="secondary">Good</Badge>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Avg Segment Length</p>
                  <p className="text-lg font-semibold">
                    {Math.round(speakerMetrics.reduce((sum, s) => sum + s.avgSegmentLength, 0) / speakerMetrics.length)}s
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sentiment Journey */}
      {selectedView === "sentiment" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Emotional Journey
              </h3>
              <Badge variant="secondary">Overall: Positive</Badge>
            </div>

            <div className="relative h-[300px] bg-muted/30 rounded-lg p-6">
              <svg className="w-full h-full">
                {/* Grid lines */}
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" strokeDasharray="4" />

                {/* Sentiment line */}
                <polyline
                  points={sentimentJourney.map((point, index) => {
                    const x = (index / (sentimentJourney.length - 1)) * 100;
                    const y = 50 - (point.sentiment * 40);
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#sentimentGradient)"
                  strokeWidth="3"
                  className="drop-shadow-lg"
                />

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>

                {/* Data points */}
                {sentimentJourney.map((point, index) => {
                  const x = (index / (sentimentJourney.length - 1)) * 100;
                  const y = 50 - (point.sentiment * 40);
                  const color = point.sentiment > 0.3 ? "#22c55e" : point.sentiment < -0.3 ? "#ef4444" : "#eab308";

                  return (
                    <g key={index}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="4"
                        fill={color}
                        className="cursor-pointer hover:r-6 transition-all"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Labels */}
              <div className="absolute top-2 left-2 text-xs text-muted-foreground">Positive</div>
              <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">Negative</div>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {sentimentJourney.map((point, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      point.sentiment > 0.3
                        ? "bg-green-50 dark:bg-green-950/20"
                        : point.sentiment < -0.3
                        ? "bg-red-50 dark:bg-red-950/20"
                        : "bg-yellow-50 dark:bg-yellow-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{point.text}</p>
                        <p className="text-xs text-muted-foreground">{point.speaker}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatTime(point.timestamp)}
                        </Badge>
                        {getSentimentIcon(point.sentiment > 0.3 ? "positive" : point.sentiment < -0.3 ? "negative" : "neutral")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}

      {/* Decision Tree */}
      {selectedView === "decisions" && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Decision Tree
              </h3>
              <Badge variant="secondary">{decisionTree.length} decisions</Badge>
            </div>

            <div className="space-y-6">
              {decisionTree.map((decision, index) => (
                <div key={decision.id} className="relative">
                  {index < decisionTree.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
                  )}

                  <Card className="p-5 relative">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 text-primary" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h4 className="font-semibold text-lg mb-2">{decision.decision}</h4>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(decision.timestamp)}
                              </Badge>
                            </div>
                            <Badge className={getDecisionColor(decision.outcome)}>
                              {decision.outcome}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">Reasoning:</p>
                              <ul className="space-y-1">
                                {decision.reasoning.map((reason, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-sm font-medium mb-2">Alternatives Considered:</p>
                              <ul className="space-y-1">
                                {decision.alternatives.map((alt, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                                    <span className="mt-0.5">•</span>
                                    <span>{alt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          📊 <strong>Visual Insights:</strong> Word clouds show topic frequency with sentiment
          color-coding. Speaker analytics reveal participation balance. Sentiment journey tracks
          emotional flow throughout the meeting. Decision trees document reasoning and alternatives
          for key choices.
        </p>
      </Card>
    </div>
  );
};

export default VisualAnalytics;
