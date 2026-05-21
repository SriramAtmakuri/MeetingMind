import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Mic, FileText, CheckSquare, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { searchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const Search = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  const handleSearch = (value: string) => {
    setQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 500);
    return () => clearTimeout(timer);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 2
  });

  const results = data?.results || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transcript':
        return <FileText className="w-4 h-4" />;
      case 'action_item':
        return <CheckSquare className="w-4 h-4" />;
      case 'decision':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      transcript: 'bg-primary-light text-primary',
      action_item: 'bg-success-light text-success',
      decision: 'bg-warning-light text-warning'
    };
    return colors[type as keyof typeof colors] || 'bg-muted';
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <mark key={i} className="bg-primary/20 text-primary font-medium">{part}</mark> :
        <span key={i}>{part}</span>
    );
  };

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

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Search Your Meetings</h1>
            <p className="text-lg text-muted-foreground">
              Find discussions, decisions, and action items across all your meetings
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              placeholder="Search for topics, keywords, decisions..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-14 h-16 text-lg"
              autoFocus
            />
          </div>

          {/* Results */}
          {query.length === 0 && (
            <Card className="p-12 border-border">
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <SearchIcon className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                  <p className="text-sm text-muted-foreground">
                    Type at least 3 characters to search across your meetings
                  </p>
                </div>
              </div>
            </Card>
          )}

          {query.length > 0 && query.length < 3 && (
            <Card className="p-8 border-border">
              <p className="text-center text-muted-foreground">
                Type at least 3 characters to search...
              </p>
            </Card>
          )}

          {debouncedQuery.length >= 3 && isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </Card>
              ))}
            </div>
          )}

          {debouncedQuery.length >= 3 && !isLoading && error && (
            <Card className="p-8 border-border border-destructive/20">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <p>Failed to search. Please try again.</p>
              </div>
            </Card>
          )}

          {debouncedQuery.length >= 3 && !isLoading && !error && results.length === 0 && (
            <Card className="p-12 border-border">
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <SearchIcon className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try different keywords or check your spelling
                  </p>
                </div>
              </div>
            </Card>
          )}

          {debouncedQuery.length >= 3 && !isLoading && !error && results.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>

              {results.map((result: any, index: number) => (
                <Link key={index} to={`/meeting/${result.meeting_id}`}>
                  <Card className="p-6 border-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeBadge(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeBadge(result.type)}>
                            {result.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {result.meeting_title}
                          </span>
                        </div>

                        <p className="text-foreground leading-relaxed mb-2">
                          {highlightText(result.text, query)}
                        </p>

                        {result.assignee && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Assigned to: {result.assignee}</span>
                          </div>
                        )}

                        {result.made_by && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Decided by: {result.made_by}</span>
                          </div>
                        )}

                        {result.speaker_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Speaker: {result.speaker_name}</span>
                            {result.start_time && (
                              <span>• {Math.floor(result.start_time / 60)}:{String(Math.floor(result.start_time % 60)).padStart(2, '0')}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
