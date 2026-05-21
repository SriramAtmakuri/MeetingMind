import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, FileText, CheckSquare, TrendingUp, Search, Sparkles, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              MeetingMind
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-primary/20 text-primary text-sm font-medium mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-4 h-4" />
            Transform meetings into actionable intelligence
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Never lose a
            <span className="block bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
              meeting insight again
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Upload recordings, get AI-powered transcription, action items, decisions, and sentiment analysis. 
            Build a searchable knowledge base of every meeting.
          </p>
          
          <div className="flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link to="/dashboard">
              <Button variant="hero" size="lg" className="text-base">
                Get Started Free
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="text-base gap-2"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Play className="w-4 h-4" />
              See Features
            </Button>
          </div>

          <div className="pt-8 text-sm text-muted-foreground animate-in fade-in duration-700 delay-400">
            No credit card required • 3 meetings free • Takes 2 minutes
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Transcription</h3>
            <p className="text-muted-foreground">
              AI-powered transcription with speaker detection, timestamps, and automatic punctuation.
            </p>
          </Card>

          <Card className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-warning-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Action Items</h3>
            <p className="text-muted-foreground">
              Automatically extract action items with assignees, deadlines, and priorities.
            </p>
          </Card>

          <Card className="p-6 border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sentiment Analysis</h3>
            <p className="text-muted-foreground">
              Track emotional tone, engagement levels, and identify tension points in conversations.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-br from-primary/5 to-primary-dark/5 border-primary/20">
          <Search className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h3 className="text-3xl font-bold mb-4">
            Searchable Meeting Knowledge Base
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find any discussion, decision, or action item across all your meetings with semantic search powered by AI.
          </p>
          <Link to="/dashboard">
            <Button variant="hero" size="lg">
              Start Building Your Knowledge Base
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2025 MeetingMind. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="mailto:support@meetingmind.app" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
