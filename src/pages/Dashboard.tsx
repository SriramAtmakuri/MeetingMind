import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Upload, Search, Clock, Users, TrendingUp, 
  MoreVertical, Play, FileText, CheckSquare 
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockMeetings = [
  {
    id: "1",
    title: "Q1 Product Strategy Review",
    date: "2025-01-15",
    duration: "45 min",
    participants: 8,
    status: "completed",
    actionItems: 12,
    decisions: 5,
    sentiment: "positive"
  },
  {
    id: "2",
    title: "Marketing Campaign Planning",
    date: "2025-01-14",
    duration: "32 min",
    participants: 5,
    status: "completed",
    actionItems: 8,
    decisions: 3,
    sentiment: "neutral"
  },
  {
    id: "3",
    title: "Engineering Sprint Retrospective",
    date: "2025-01-13",
    duration: "60 min",
    participants: 12,
    status: "completed",
    actionItems: 15,
    decisions: 7,
    sentiment: "positive"
  }
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">MeetingMind</h1>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="hero" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Meeting
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Meetings</p>
                <p className="text-3xl font-bold">24</p>
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
                <p className="text-3xl font-bold">156</p>
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
                <p className="text-3xl font-bold">18.5h</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-light flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Engagement</p>
                <p className="text-3xl font-bold">87%</p>
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

        {/* Meetings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Meetings</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>

          {mockMeetings.map((meeting) => (
            <Link key={meeting.id} to={`/meeting/${meeting.id}`}>
              <Card className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {meeting.date}
                          </span>
                          <span>{meeting.duration}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {meeting.participants}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {meeting.actionItems} actions
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="w-3 h-3" />
                        {meeting.decisions} decisions
                      </Badge>
                      <Badge 
                        className={
                          meeting.sentiment === "positive" 
                            ? "bg-success-light text-success border-success/20" 
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {meeting.sentiment === "positive" ? "Positive" : "Neutral"}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Export Summary</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
