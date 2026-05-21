import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Brain,
  MessageCircleQuestion,
  Sparkles,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Filter,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface SemanticSearchResult {
  meetingId: string;
  meetingTitle: string;
  matchType: "exact" | "semantic" | "related";
  relevanceScore: number;
  snippet: string;
  timestamp?: number;
  speaker?: string;
  createdAt: string;
  category?: string;
}

interface QuestionAnswer {
  question: string;
  answer: string;
  confidence: number;
  sources: {
    meetingId: string;
    meetingTitle: string;
    timestamp: number;
    snippet: string;
  }[];
}

const SemanticSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic" | "question">("semantic");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month" | "quarter">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const mockResults: SemanticSearchResult[] = [
    {
      meetingId: "1",
      meetingTitle: "Q1 Product Strategy Review",
      matchType: "semantic",
      relevanceScore: 0.95,
      snippet: "We discussed budget allocation for the mobile development team, allocating $200k for Q2...",
      timestamp: 450,
      speaker: "Sarah Chen",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: "planning",
    },
    {
      meetingId: "3",
      meetingTitle: "Client Presentation - Acme Corp",
      matchType: "related",
      relevanceScore: 0.82,
      snippet: "The client expressed concerns about the project costs and timeline implications...",
      timestamp: 720,
      speaker: "Mike Johnson",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: "client",
    },
    {
      meetingId: "2",
      meetingTitle: "Weekly Team Standup",
      matchType: "exact",
      relevanceScore: 0.78,
      snippet: "Budget review scheduled for next week, need to prepare expense reports...",
      timestamp: 180,
      speaker: "Emily Rodriguez",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: "standup",
    },
  ];

  const mockQA: QuestionAnswer = {
    question: "What were the main concerns about the budget?",
    answer: "The main budget concerns discussed were: (1) Mobile development costs exceeding initial estimates by 15%, (2) Client concerns about project timeline implications affecting overall costs, and (3) Need for better expense tracking across teams.",
    confidence: 0.89,
    sources: [
      {
        meetingId: "1",
        meetingTitle: "Q1 Product Strategy Review",
        timestamp: 450,
        snippet: "Mobile development costs have exceeded our initial estimates by approximately 15%...",
      },
      {
        meetingId: "3",
        meetingTitle: "Client Presentation - Acme Corp",
        timestamp: 720,
        snippet: "The client expressed concerns about the project costs and timeline implications...",
      },
    ],
  };

  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [qaAnswer, setQAAnswer] = useState<QuestionAnswer | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const suggestedQueries = [
    "What decisions were made about the mobile app?",
    "Show me discussions about budget concerns",
    "When did we talk about hiring?",
    "What risks were identified?",
    "Find meetings where John disagreed",
    "What are the main action items from last week?",
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    setTimeout(() => {
      if (searchMode === "question") {
        setQAAnswer(mockQA);
        setResults([]);
      } else {
        setResults(mockResults);
        setQAAnswer(null);
      }
      setIsSearching(false);
    }, 1000);
  };

  const getMatchTypeBadge = (type: SemanticSearchResult["matchType"]) => {
    switch (type) {
      case "exact":
        return <Badge variant="default">Exact Match</Badge>;
      case "semantic":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          <Brain className="w-3 h-3 mr-1" />
          Semantic
        </Badge>;
      case "related":
        return <Badge variant="outline">Related</Badge>;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.75) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI-Powered Search</h2>
              <p className="text-sm text-muted-foreground">
                Search by meaning, not just keywords. Ask questions, find insights.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={searchMode === "semantic" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("semantic")}
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Semantic Search
            </Button>
            <Button
              variant={searchMode === "keyword" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("keyword")}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Keyword Search
            </Button>
            <Button
              variant={searchMode === "question" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchMode("question")}
              className="gap-2"
            >
              <MessageCircleQuestion className="w-4 h-4" />
              Ask Question
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={
                  searchMode === "question"
                    ? "Ask a question about your meetings..."
                    : searchMode === "semantic"
                    ? "Search by concept (e.g., 'budget concerns', 'technical risks')..."
                    : "Search by keywords..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button onClick={handleSearch} size="lg" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="quarter">Past Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="standup">Standup</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {!results.length && !qaAnswer && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Try These Searches
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {suggestedQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left"
                onClick={() => {
                  setSearchQuery(query);
                  setSearchMode(query.startsWith("What") || query.startsWith("When") ? "question" : "semantic");
                }}
              >
                <MessageCircleQuestion className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{query}</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {qaAnswer && (
        <Card className="p-6 border-2 border-primary/20 bg-primary/5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">AI Answer</h3>
                  <Badge variant="secondary" className={getRelevanceColor(qaAnswer.confidence)}>
                    {Math.round(qaAnswer.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  "{qaAnswer.question}"
                </p>
                <p className="text-base leading-relaxed mb-4">
                  {qaAnswer.answer}
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Sources ({qaAnswer.sources.length})
                  </h4>
                  <div className="space-y-2">
                    {qaAnswer.sources.map((source, index) => (
                      <Link
                        key={index}
                        to={`/meeting/${source.meetingId}?t=${source.timestamp}`}
                        className="block"
                      >
                        <Card className="p-3 hover:shadow-md transition-all hover:-translate-y-0.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1">
                                {source.meetingTitle}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {snippet}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                @{Math.floor(source.timestamp / 60)}:{String(source.timestamp % 60).padStart(2, '0')}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Search Results
              <Badge variant="secondary">{results.length}</Badge>
            </h3>
            <Select defaultValue="relevance">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="score">Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {results.map((result, index) => (
                <Link
                  key={index}
                  to={`/meeting/${result.meetingId}${result.timestamp ? `?t=${result.timestamp}` : ''}`}
                >
                  <Card className="p-5 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg truncate">
                              {result.meetingTitle}
                            </h4>
                            {getMatchTypeBadge(result.matchType)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                            </span>
                            {result.speaker && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {result.speaker}
                              </span>
                            )}
                            {result.category && (
                              <Badge variant="outline" className="capitalize">
                                {result.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`text-2xl font-bold ${getRelevanceColor(result.relevanceScore)}`}>
                            {Math.round(result.relevanceScore * 100)}%
                          </div>
                          <span className="text-xs text-muted-foreground">relevance</span>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg">
                        "{result.snippet}"
                      </p>

                      {result.timestamp && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            Jump to {Math.floor(result.timestamp / 60)}:{String(result.timestamp % 60).padStart(2, '0')}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>How it works:</strong> Semantic search understands the meaning behind your
          query, not just exact keywords. Ask questions naturally, and our AI will find relevant
          discussions even if they use different words. Try searching for concepts like "budget
          concerns" or "timeline risks" to see semantic matching in action.
        </p>
      </Card>
    </div>
  );
};

export default SemanticSearch;
