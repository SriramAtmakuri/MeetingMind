import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PrivacyCompliance = () => {
  const { toast } = useToast();

  // Privacy Settings
  const [anonymizeSpeakers, setAnonymizeSpeakers] = useState(false);
  const [autoRedaction, setAutoRedaction] = useState(true);
  const [encryptRecordings, setEncryptRecordings] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);

  // Compliance Templates
  const [activeTemplate, setActiveTemplate] = useState<string>("general");
  const complianceTemplates = [
    {
      id: "general",
      name: "General Business",
      description: "Standard privacy and compliance settings",
      features: ["Basic encryption", "30-day retention", "Speaker anonymization"],
    },
    {
      id: "hipaa",
      name: "HIPAA Compliant",
      description: "Healthcare data protection standards",
      features: [
        "End-to-end encryption",
        "PHI redaction",
        "Audit logs",
        "7-year retention",
        "Access controls",
      ],
    },
    {
      id: "gdpr",
      name: "GDPR Compliant",
      description: "EU data protection regulations",
      features: [
        "Data minimization",
        "Right to erasure",
        "Consent management",
        "Data portability",
        "Breach notification",
      ],
    },
    {
      id: "soc2",
      name: "SOC 2 Type II",
      description: "Security and availability controls",
      features: [
        "Access logging",
        "Encryption at rest",
        "Security monitoring",
        "Incident response",
        "Vendor management",
      ],
    },
  ];

  // Retention Policy
  const [retentionPeriod, setRetentionPeriod] = useState("90");
  const [autoDelete, setAutoDelete] = useState(true);

  // Redaction Patterns
  const [redactionPatterns, setRedactionPatterns] = useState([
    { id: "ssn", name: "Social Security Numbers", pattern: "\\d{3}-\\d{2}-\\d{4}", enabled: true },
    { id: "credit", name: "Credit Card Numbers", pattern: "\\d{4}-\\d{4}-\\d{4}-\\d{4}", enabled: true },
    { id: "email", name: "Email Addresses", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", enabled: false },
    { id: "phone", name: "Phone Numbers", pattern: "\\(\\d{3}\\) \\d{3}-\\d{4}", enabled: true },
    { id: "password", name: "Passwords (keyword)", pattern: "password[:\\s]+\\S+", enabled: true },
  ]);

  const toggleRedactionPattern = (id: string) => {
    setRedactionPatterns(prev =>
      prev.map(pattern =>
        pattern.id === id ? { ...pattern, enabled: !pattern.enabled } : pattern
      )
    );

    toast({
      title: "Redaction pattern updated",
      description: "Auto-redaction settings have been saved.",
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setActiveTemplate(templateId);

    const template = complianceTemplates.find(t => t.id === templateId);

    // Apply template-specific settings
    if (templateId === "hipaa") {
      setEncryptRecordings(true);
      setAutoRedaction(true);
      setRetentionPeriod("2555"); // 7 years
      setAnonymizeSpeakers(false);
      setRequireConsent(true);
    } else if (templateId === "gdpr") {
      setEncryptRecordings(true);
      setAutoRedaction(true);
      setRetentionPeriod("365");
      setRequireConsent(true);
      setAnonymizeSpeakers(true);
    } else if (templateId === "soc2") {
      setEncryptRecordings(true);
      setAutoRedaction(true);
      setRetentionPeriod("365");
      setRequireConsent(false);
    } else {
      setEncryptRecordings(true);
      setAutoRedaction(true);
      setRetentionPeriod("90");
      setRequireConsent(false);
    }

    toast({
      title: "Compliance template applied",
      description: `${template?.name} settings have been configured.`,
    });
  };

  const enabledRedactions = redactionPatterns.filter(p => p.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Privacy & Compliance</h2>
              <p className="text-sm text-muted-foreground">
                Protect sensitive data and meet regulatory requirements
              </p>
            </div>
          </div>
          <Badge variant="default" className="gap-2 px-4 py-2">
            <CheckCircle2 className="w-4 h-4" />
            {activeTemplate === "general" ? "Standard" : complianceTemplates.find(t => t.id === activeTemplate)?.name}
          </Badge>
        </div>
      </Card>

      {/* Compliance Templates */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold">Compliance Templates</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {complianceTemplates.map((template) => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all ${
                  activeTemplate === template.id
                    ? "border-2 border-primary bg-primary/5"
                    : "hover:shadow-md"
                }`}
                onClick={() => handleTemplateChange(template.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {template.name}
                        {activeTemplate === template.id && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5" />
              <h3 className="font-semibold">Privacy Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="anonymize" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff className="w-4 h-4" />
                      <span className="font-medium">Speaker Anonymization</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Replace speaker names with generic identifiers
                    </p>
                  </Label>
                </div>
                <Switch
                  id="anonymize"
                  checked={anonymizeSpeakers}
                  onCheckedChange={setAnonymizeSpeakers}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="redaction" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">Auto Redaction</span>
                      <Badge variant="secondary" className="text-xs">
                        {enabledRedactions} patterns
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically redact sensitive information
                    </p>
                  </Label>
                </div>
                <Switch
                  id="redaction"
                  checked={autoRedaction}
                  onCheckedChange={setAutoRedaction}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="encrypt" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">End-to-End Encryption</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Encrypt recordings and transcripts at rest
                    </p>
                  </Label>
                </div>
                <Switch
                  id="encrypt"
                  checked={encryptRecordings}
                  onCheckedChange={setEncryptRecordings}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="consent" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Recording Consent</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Require participant consent before recording
                    </p>
                  </Label>
                </div>
                <Switch
                  id="consent"
                  checked={requireConsent}
                  onCheckedChange={setRequireConsent}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Retention Policy */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              <h3 className="font-semibold">Data Retention Policy</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retention-period">Retention Period (days)</Label>
                <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                  <SelectTrigger id="retention-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days (Recommended)</SelectItem>
                    <SelectItem value="180">6 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="2555">7 years (HIPAA)</SelectItem>
                    <SelectItem value="-1">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Meetings older than this period will be automatically deleted
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="auto-delete" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium">Auto-Delete Expired Meetings</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically delete meetings after retention period
                    </p>
                  </Label>
                </div>
                <Switch
                  id="auto-delete"
                  checked={autoDelete}
                  onCheckedChange={setAutoDelete}
                />
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Data Deletion is Permanent
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Once meetings are deleted, they cannot be recovered. Ensure you have
                      exported any important data before it expires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Storage</span>
                  <span className="text-sm text-muted-foreground">3 meetings</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Upcoming Deletions</span>
                  <span className="text-sm text-muted-foreground">0 meetings</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Oldest Meeting</span>
                  <span className="text-sm text-muted-foreground">5 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Redaction Patterns */}
      {autoRedaction && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h3 className="font-semibold">Auto-Redaction Patterns</h3>
                <Badge variant="secondary">{enabledRedactions} active</Badge>
              </div>
              <Button variant="outline" size="sm">
                Add Custom Pattern
              </Button>
            </div>

            <div className="space-y-2">
              {redactionPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{pattern.name}</span>
                      {pattern.enabled && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {pattern.pattern}
                    </p>
                  </div>
                  <Switch
                    checked={pattern.enabled}
                    onCheckedChange={() => toggleRedactionPattern(pattern.id)}
                  />
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Example:</strong> "My SSN is 123-45-6789" → "My SSN is [REDACTED]"
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Compliance Best Practices:</strong> Select the appropriate template for
          your industry (HIPAA for healthcare, GDPR for EU users, SOC 2 for enterprise). Enable
          auto-redaction to protect sensitive data like SSNs and credit cards. Set appropriate
          retention policies based on legal requirements.
        </p>
      </Card>
    </div>
  );
};

export default PrivacyCompliance;
