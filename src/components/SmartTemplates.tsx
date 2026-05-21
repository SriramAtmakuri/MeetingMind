import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Zap,
  Plus,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Users,
  Target,
  Brain,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { templatesApi } from "@/lib/api";

interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  agenda: string[];
  timeAllocation: Record<string, number>;
  participants: string[];
  autoActions: string[];
  usageCount: number;
}

const SmartTemplates = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<MeetingTemplate[]>([
    {
      id: "standup",
      name: "Daily Standup",
      description: "Quick team sync-up meeting",
      category: "Team",
      icon: <Users className="w-5 h-5" />,
      agenda: [
        "What did you accomplish yesterday?",
        "What are you working on today?",
        "Any blockers or impediments?",
      ],
      timeAllocation: {
        "Team updates": 10,
        "Blocker discussion": 5,
      },
      participants: [],
      autoActions: [
        "Create action item for each blocker",
        "Schedule follow-up if discussion exceeds 15 minutes",
      ],
      usageCount: 247,
    },
    {
      id: "retrospective",
      name: "Sprint Retrospective",
      description: "Reflect on sprint and identify improvements",
      category: "Agile",
      icon: <Target className="w-5 h-5" />,
      agenda: [
        "What went well?",
        "What could be improved?",
        "Action items for next sprint",
      ],
      timeAllocation: {
        "What went well": 15,
        "What could be improved": 20,
        "Action planning": 15,
        "Voting on actions": 10,
      },
      participants: [],
      autoActions: [
        "Group similar feedback items",
        "Create Jira tickets from action items",
        "Send summary to team Slack channel",
      ],
      usageCount: 98,
    },
    {
      id: "one-on-one",
      name: "1-on-1 Meeting",
      description: "Personal check-in with team member",
      category: "Management",
      icon: <Users className="w-5 h-5" />,
      agenda: [
        "How are you feeling about work?",
        "Progress on goals and objectives",
        "Career development discussion",
        "Feedback (both ways)",
      ],
      timeAllocation: {
        "Check-in": 5,
        "Goals review": 15,
        "Career development": 15,
        "Feedback": 10,
        "Action items": 5,
      },
      participants: [],
      autoActions: [
        "Track action items for next 1-on-1",
        "Update performance review notes",
        "Schedule follow-up if needed",
      ],
      usageCount: 156,
    },
    {
      id: "client-call",
      name: "Client Presentation",
      description: "Present project progress to client",
      category: "Client",
      icon: <FileText className="w-5 h-5" />,
      agenda: [
        "Welcome and introductions",
        "Project status update",
        "Demo of new features",
        "Discuss next steps and timeline",
        "Q&A session",
      ],
      timeAllocation: {
        "Introductions": 5,
        "Status update": 10,
        "Demo": 20,
        "Timeline discussion": 10,
        "Q&A": 15,
      },
      participants: [],
      autoActions: [
        "Send meeting summary to client",
        "Create follow-up action items",
        "Schedule next check-in",
        "Export decisions for contract addendum",
      ],
      usageCount: 73,
    },
    {
      id: "planning",
      name: "Sprint Planning",
      description: "Plan work for upcoming sprint",
      category: "Agile",
      icon: <Target className="w-5 h-5" />,
      agenda: [
        "Review sprint goal",
        "Estimate story points",
        "Discuss technical approach",
        "Assign tasks",
        "Identify dependencies",
      ],
      timeAllocation: {
        "Sprint goal": 10,
        "Story estimation": 45,
        "Technical discussion": 30,
        "Task assignment": 20,
        "Dependencies": 15,
      },
      participants: [],
      autoActions: [
        "Update Jira sprint backlog",
        "Assign stories to team members",
        "Create dependency tracking tasks",
        "Set sprint start and end dates",
      ],
      usageCount: 112,
    },
    {
      id: "brainstorm",
      name: "Brainstorming Session",
      description: "Generate ideas and solutions",
      category: "Creative",
      icon: <Brain className="w-5 h-5" />,
      agenda: [
        "Define problem statement",
        "Silent idea generation (5 min)",
        "Share and discuss ideas",
        "Group similar concepts",
        "Vote on top ideas",
      ],
      timeAllocation: {
        "Problem framing": 10,
        "Silent brainstorming": 5,
        "Idea sharing": 20,
        "Grouping": 10,
        "Voting": 10,
        "Action planning": 5,
      },
      participants: [],
      autoActions: [
        "Capture all ideas in shared document",
        "Create action items for top 3 ideas",
        "Schedule follow-up to review progress",
      ],
      usageCount: 65,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<MeetingTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // AI-generated suggestions
  const [aiSuggestions, setAiSuggestions] = useState({
    nextMeeting: "Based on your calendar, you have a 1-on-1 with Sarah Chen tomorrow at 2 PM",
    recommendedTemplate: "one-on-one",
    autoAgenda: [
      "Follow up on Q1 goals discussion from last month",
      "Discuss progress on mobile app project",
      "Career development: Senior Engineer promotion timeline",
    ],
    estimatedDuration: 45,
    suggestedParticipants: ["Sarah Chen"],
  });

  const handleUseTemplate = async (template: MeetingTemplate) => {
    try {
      const response = await templatesApi.apply(template.id);

      toast({
        title: "Meeting created!",
        description: `Created "${response.meeting.title}" from ${template.name} template.`,
      });

      // Update usage count locally
      setTemplates(prev =>
        prev.map(t =>
          t.id === template.id
            ? { ...t, usageCount: t.usageCount + 1 }
            : t
        )
      );

      // Navigate to the new meeting
      setTimeout(() => {
        navigate(`/meeting/${response.meeting.id}`);
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create meeting from template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTemplate = (template: MeetingTemplate) => {
    const newTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
    };

    setTemplates([...templates, newTemplate]);

    toast({
      title: "Template duplicated",
      description: `Created a copy of "${template.name}".`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    setTemplates(prev => prev.filter(t => t.id !== templateId));

    toast({
      title: "Template deleted",
      description: "Meeting template has been removed.",
    });
  };

  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const mostUsedTemplate = templates.reduce((prev, current) =>
    prev.usageCount > current.usageCount ? prev : current
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Templates</h2>
              <p className="text-sm text-muted-foreground">
                Automate your meetings with pre-built templates
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{templates.length}</p>
            <p className="text-sm text-muted-foreground">Templates</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Uses</p>
              <p className="text-2xl font-bold">{totalUsage}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Most Used</p>
              <p className="text-lg font-semibold truncate">{mostUsedTemplate.name}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Time Saved</p>
              <p className="text-2xl font-bold">12.5h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* AI-Powered Suggestions */}
      <Card className="p-6 border-2 border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">AI Meeting Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Automatically suggested for your next meeting
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm mb-3">{aiSuggestions.nextMeeting}</p>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Suggested Agenda</Label>
                <ul className="space-y-1">
                  {aiSuggestions.autoAgenda.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {aiSuggestions.estimatedDuration} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {aiSuggestions.suggestedParticipants.length} participant(s)
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                const template = templates.find(t => t.id === aiSuggestions.recommendedTemplate);
                if (template) handleUseTemplate(template);
              }}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Use AI-Generated Agenda
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Available Templates</h3>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="p-5 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {template.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Agenda Items</Label>
                  <ul className="space-y-1">
                    {template.agenda.slice(0, 3).map((item, index) => (
                      <li key={index} className="text-xs flex items-start gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span className="truncate">{item}</span>
                      </li>
                    ))}
                    {template.agenda.length > 3 && (
                      <li className="text-xs text-muted-foreground italic">
                        +{template.agenda.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    Used {template.usageCount} times
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTemplate(template);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <>
          <Card className="fixed inset-0 z-50 m-auto max-w-3xl max-h-[700px] overflow-auto p-6">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {selectedTemplate.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Close
                  </Button>
                </div>

                {/* Agenda */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Meeting Agenda</h4>
                  <div className="space-y-2">
                    {selectedTemplate.agenda.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <p className="text-sm flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Allocation */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Time Allocation</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedTemplate.timeAllocation).map(([section, minutes]) => (
                      <div
                        key={section}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm">{section}</span>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {minutes} min
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Duration</span>
                      <span className="font-bold text-primary">
                        {Object.values(selectedTemplate.timeAllocation).reduce((a, b) => a + b, 0)} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Automated Actions</h4>
                  <div className="space-y-2">
                    {selectedTemplate.autoActions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                      >
                        <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleUseTemplate(selectedTemplate);
                      setSelectedTemplate(null);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Use This Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDuplicateTemplate(selectedTemplate)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDeleteTemplate(selectedTemplate.id);
                      setSelectedTemplate(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </Card>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedTemplate(null)}
          />
        </>
      )}

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Pro Tip:</strong> Templates save time and ensure consistency. Use AI suggestions
          to automatically generate agendas based on your calendar, past meetings, and team patterns.
          Customize any template to match your team's unique workflow.
        </p>
      </Card>
    </div>
  );
};

export default SmartTemplates;
