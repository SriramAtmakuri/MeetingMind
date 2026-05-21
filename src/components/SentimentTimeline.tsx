import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TimelinePoint {
  time: string;
  value: number;
  speaker: string;
  sentiment?: "positive" | "neutral" | "negative";
  text?: string;
}

interface SentimentTimelineProps {
  timeline: TimelinePoint[];
  tensionPoints?: { time: string; reason: string }[];
}

const getSentimentFromValue = (value: number): "positive" | "neutral" | "negative" => {
  if (value >= 70) return "positive";
  if (value >= 40) return "neutral";
  return "negative";
};

const getSentimentColor = (sentiment: "positive" | "neutral" | "negative") => {
  switch (sentiment) {
    case "positive": return "hsl(var(--sentiment-positive))";
    case "neutral": return "hsl(var(--sentiment-neutral))";
    case "negative": return "hsl(var(--sentiment-negative))";
  }
};

const SentimentTimeline = ({ timeline, tensionPoints = [] }: SentimentTimelineProps) => {
  const maxValue = 100;
  const minValue = 0;
  const heightPx = 200;

  // Enhanced timeline with more granular data points
  const enhancedTimeline = timeline.map(point => ({
    ...point,
    sentiment: point.sentiment || getSentimentFromValue(point.value)
  }));

  return (
    <div className="space-y-6">
      {/* Timeline Visualization */}
      <Card className="p-6 border-border">
        <h3 className="text-lg font-semibold mb-4">Sentiment Timeline</h3>
        
        <div className="relative" style={{ height: `${heightPx + 60}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-muted-foreground">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="absolute left-16 right-0 top-0" style={{ height: `${heightPx}px` }}>
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map(value => (
                <div
                  key={value}
                  className="absolute left-0 right-0 border-t border-border/30"
                  style={{ bottom: `${(value / maxValue) * heightPx}px` }}
                />
              ))}
            </div>

            {/* Sentiment zones background */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute left-0 right-0 bg-success/5"
                style={{ top: 0, height: `${(30 / maxValue) * heightPx}px` }}
              />
              <div 
                className="absolute left-0 right-0 bg-sentiment-neutral/5"
                style={{ top: `${(30 / maxValue) * heightPx}px`, height: `${(30 / maxValue) * heightPx}px` }}
              />
              <div 
                className="absolute left-0 right-0 bg-destructive/5"
                style={{ top: `${(60 / maxValue) * heightPx}px`, height: `${(40 / maxValue) * heightPx}px` }}
              />
            </div>

            {/* Timeline path */}
            <svg className="absolute inset-0 overflow-visible" style={{ width: '100%', height: `${heightPx}px` }}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {enhancedTimeline.map((point, i) => (
                    <stop
                      key={i}
                      offset={`${(i / (enhancedTimeline.length - 1)) * 100}%`}
                      stopColor={getSentimentColor(point.sentiment)}
                    />
                  ))}
                </linearGradient>
              </defs>
              
              <polyline
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={enhancedTimeline
                  .map((point, i) => {
                    const x = (i / (enhancedTimeline.length - 1)) * 100;
                    const y = heightPx - ((point.value / maxValue) * heightPx);
                    return `${x}%,${y}`;
                  })
                  .join(' ')}
              />

              {/* Data points */}
              {enhancedTimeline.map((point, i) => {
                const x = (i / (enhancedTimeline.length - 1)) * 100;
                const y = heightPx - ((point.value / maxValue) * heightPx);
                return (
                  <g key={i}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="5"
                      fill={getSentimentColor(point.sentiment)}
                      stroke="hsl(var(--background))"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-8 transition-all"
                    />
                  </g>
                );
              })}

              {/* Tension points markers */}
              {tensionPoints.map((tension, i) => {
                const timelinePoint = enhancedTimeline.find(p => p.time === tension.time);
                if (!timelinePoint) return null;
                
                const pointIndex = enhancedTimeline.indexOf(timelinePoint);
                const x = (pointIndex / (enhancedTimeline.length - 1)) * 100;
                const y = heightPx - ((timelinePoint.value / maxValue) * heightPx);
                
                return (
                  <g key={i}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="8"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="hsl(var(--destructive))"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Speaker labels */}
            <div className="absolute left-0 right-0 flex justify-between" style={{ top: `${heightPx + 12}px` }}>
              {enhancedTimeline.map((point, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1"
                  style={{ width: `${100 / enhancedTimeline.length}%` }}
                >
                  <span className="text-xs text-muted-foreground">{point.time}</span>
                  <span className="text-xs font-medium truncate max-w-full px-1">
                    {point.speaker.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Positive (70-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sentiment-neutral" />
            <span className="text-sm text-muted-foreground">Neutral (40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Negative (0-39)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-sm text-muted-foreground">Tension Point</span>
          </div>
        </div>
      </Card>

      {/* Tension Points Detail */}
      {tensionPoints.length > 0 && (
        <Card className="p-6 border-border border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold">Tension Points Detected</h3>
          </div>
          <div className="space-y-3">
            {tensionPoints.map((tension, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                <Badge variant="destructive" className="mt-0.5">{tension.time}</Badge>
                <p className="text-sm text-muted-foreground flex-1">{tension.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Engagement Insights */}
      <Card className="p-6 border-border">
        <h3 className="text-lg font-semibold mb-4">Engagement Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-success-light border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">Peak Engagement</span>
            </div>
            <p className="text-2xl font-bold text-success">92%</p>
            <p className="text-xs text-muted-foreground mt-1">at 01:02 during decision making</p>
          </div>

          <div className="p-4 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Average Sentiment</span>
            </div>
            <p className="text-2xl font-bold">79%</p>
            <p className="text-xs text-muted-foreground mt-1">Consistently positive throughout</p>
          </div>

          <div className="p-4 rounded-lg bg-warning-light border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium">Low Point</span>
            </div>
            <p className="text-2xl font-bold">65%</p>
            <p className="text-xs text-muted-foreground mt-1">at 00:15 discussing blockers</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SentimentTimeline;
