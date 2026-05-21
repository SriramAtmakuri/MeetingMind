import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Mail,
  MessageSquare,
  CheckSquare,
  Slack,
  FileText,
  Link as LinkIcon,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "calendar" | "communication" | "productivity" | "storage";
  isConnected: boolean;
  comingSoon?: boolean;
  config?: Record<string, any>;
}

const Integrations = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Automatically sync meeting schedules and create calendar events",
      icon: <Calendar className="w-6 h-6" />,
      category: "calendar",
      isConnected: false,
      comingSoon: true,
      config: { autoSync: true, createEvents: true, sendInvites: false },
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Sync with Outlook calendar and send meeting summaries via email",
      icon: <Mail className="w-6 h-6" />,
      category: "calendar",
      isConnected: false,
      comingSoon: true,
      config: { autoSync: false, emailSummaries: true },
    },
    {
      id: "slack",
      name: "Slack",
      description: "Post meeting summaries and action items to Slack channels",
      icon: <Slack className="w-6 h-6" />,
      category: "communication",
      isConnected: false,
      comingSoon: true,
      config: { defaultChannel: "#meetings", autoPost: true, mentionAssignees: true },
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Share meeting insights with your Teams channels",
      icon: <MessageSquare className="w-6 h-6" />,
      category: "communication",
      isConnected: false,
      comingSoon: true,
      config: { defaultChannel: "General", autoPost: false },
    },
    {
      id: "jira",
      name: "Jira",
      description: "Automatically create Jira tickets from action items",
      icon: <CheckSquare className="w-6 h-6" />,
      category: "productivity",
      isConnected: false,
      comingSoon: true,
      config: { project: "MEET", autoCreate: true, issueType: "Task" },
    },
    {
      id: "asana",
      name: "Asana",
      description: "Sync action items as Asana tasks with due dates",
      icon: <CheckSquare className="w-6 h-6" />,
      category: "productivity",
      isConnected: false,
      comingSoon: true,
      config: { workspace: "", project: "", autoCreate: false },
    },
    {
      id: "notion",
      name: "Notion",
      description: "Export meeting notes and transcripts to Notion pages",
      icon: <FileText className="w-6 h-6" />,
      category: "storage",
      isConnected: false,
      config: {
        database: "",
        autoExport: false,
      },
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Automatically backup recordings and transcripts to Google Drive",
      icon: <FileText className="w-6 h-6" />,
      category: "storage",
      isConnected: false,
      comingSoon: true,
      config: { folder: "MeetingMind Recordings", autoBackup: true },
    },
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = (integration: Integration) => {
    setIsConnecting(true);

    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, isConnected: !int.isConnected }
            : int
        )
      );

      toast({
        title: integration.isConnected ? "Disconnected" : "Connected",
        description: `${integration.name} has been ${integration.isConnected ? "disconnected" : "connected"} successfully.`,
      });

      setIsConnecting(false);
      setSelectedIntegration(null);
    }, 1500);
  };

  const handleConfigUpdate = (integrationId: string, key: string, value: any) => {
    setIntegrations(prev =>
      prev.map(int =>
        int.id === integrationId
          ? {
              ...int,
              config: { ...int.config, [key]: value },
            }
          : int
      )
    );

    toast({
      title: "Settings updated",
      description: "Integration settings have been saved.",
    });
  };

  const getCategoryIcon = (category: Integration["category"]) => {
    switch (category) {
      case "calendar":
        return <Calendar className="w-5 h-5" />;
      case "communication":
        return <MessageSquare className="w-5 h-5" />;
      case "productivity":
        return <CheckSquare className="w-5 h-5" />;
      case "storage":
        return <FileText className="w-5 h-5" />;
    }
  };

  const categories = [
    { id: "calendar", label: "Calendar", count: integrations.filter(i => i.category === "calendar").length },
    { id: "communication", label: "Communication", count: integrations.filter(i => i.category === "communication").length },
    { id: "productivity", label: "Productivity", count: integrations.filter(i => i.category === "productivity").length },
    { id: "storage", label: "Storage", count: integrations.filter(i => i.category === "storage").length },
  ];

  const connectedCount = integrations.filter(i => i.isConnected).length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Integrations</h2>
              <p className="text-sm text-muted-foreground">
                Connect MeetingMind with your favorite tools
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{connectedCount}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(category.id as Integration["category"])}
                <div>
                  <p className="font-semibold">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.count} apps</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className={`p-6 transition-all ${
              integration.isConnected
                ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                : "hover:shadow-lg"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      integration.isConnected
                        ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{integration.name}</h3>
                      {integration.isConnected && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {integration.category}
                      </Badge>
                      {integration.comingSoon && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {integration.comingSoon ? (
                  <Button variant="outline" size="sm" disabled>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                ) : integration.isConnected ? (
                  <Button variant="outline" size="sm" onClick={() => setSelectedIntegration(integration)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setSelectedIntegration(integration)}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>

              {integration.isConnected && integration.config && (
                <div className="pt-3 border-t space-y-3">
                  {Object.entries(integration.config).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`${integration.id}-${key}`} className="text-sm capitalize cursor-pointer">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      {typeof value === "boolean" ? (
                        <Switch
                          id={`${integration.id}-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            handleConfigUpdate(integration.id, key, checked)
                          }
                        />
                      ) : (
                        <Input
                          id={`${integration.id}-${key}`}
                          value={value}
                          onChange={(e) =>
                            handleConfigUpdate(integration.id, key, e.target.value)
                          }
                          className="h-8 w-32 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedIntegration && (
        <Card className="fixed inset-0 z-50 m-auto max-w-2xl max-h-[600px] overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {selectedIntegration.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedIntegration.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedIntegration.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIntegration(null)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            {!selectedIntegration.isConnected ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Connect {selectedIntegration.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to authorize MeetingMind to access your{" "}
                    {selectedIntegration.name} account.
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Secure OAuth 2.0 authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Read and write permissions only for meetings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Revoke access anytime from settings</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleConnect(selectedIntegration)}
                  disabled={isConnecting}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5 mr-2" />
                      Connect {selectedIntegration.name}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      Connected Successfully
                    </h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your {selectedIntegration.name} account is connected and active.
                  </p>
                </div>

                {selectedIntegration.config && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Configuration</h4>
                    {Object.entries(selectedIntegration.config).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`modal-${key}`} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        {typeof value === "boolean" ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`modal-${key}`}
                              checked={value}
                              onCheckedChange={(checked) =>
                                handleConfigUpdate(selectedIntegration.id, key, checked)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {value ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        ) : (
                          <Input
                            id={`modal-${key}`}
                            value={value}
                            onChange={(e) =>
                              handleConfigUpdate(selectedIntegration.id, key, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={() => handleConnect(selectedIntegration)}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 mr-2" />
                      Disconnect {selectedIntegration.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {selectedIntegration && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSelectedIntegration(null)}
        />
      )}

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Integrations help automate your workflow. Connect your calendar
          to auto-schedule meetings, link Slack to share summaries with your team, or sync action
          items to Jira/Asana for seamless project management.
        </p>
      </Card>
    </div>
  );
};

export default Integrations;
