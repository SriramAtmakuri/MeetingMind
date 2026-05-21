import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Mail,
  Bell,
  Shield,
  LogOut,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  const [notifSettings, setNotifSettings] = useState({
    meetingProcessed: true,
    actionItemsDue: true,
    weeklyDigest: false,
    teamMentions: true,
  });

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const stored = localStorage.getItem("meetingmind_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(
        "meetingmind_user",
        JSON.stringify({ ...parsed, name, email })
      );
    }
    setIsSaving(false);
    toast({ title: "Profile updated", description: "Changes saved successfully." });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Feature coming soon",
      description: "Account deletion will be available in a future release.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8 max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {user?.isGuest && (
              <Badge variant="secondary" className="mt-1">Guest Session</Badge>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Profile Information</h2>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={user?.isGuest}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={user?.isGuest}
              />
            </div>
            {user?.isGuest ? (
              <p className="text-sm text-muted-foreground">
                Create an account to save your profile.
              </p>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Notification Preferences</h2>
          </div>
          <Separator />
          <div className="space-y-4">
            {[
              { key: "meetingProcessed", label: "Meeting processed", desc: "When a recording finishes processing" },
              { key: "actionItemsDue", label: "Action items due", desc: "Reminders for upcoming deadlines" },
              { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of meetings from the past week" },
              { key: "teamMentions", label: "Team mentions", desc: "When you're assigned an action item" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={notifSettings[key as keyof typeof notifSettings]}
                  onCheckedChange={(v) =>
                    setNotifSettings((prev) => ({ ...prev, [key]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Security</h2>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed: never</p>
              </div>
              <Button variant="outline" size="sm" disabled={user?.isGuest}>
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" disabled={user?.isGuest}>
                Enable 2FA
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/30 space-y-4">
          <h2 className="font-semibold text-lg text-destructive">Danger Zone</h2>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sign out</p>
                <p className="text-xs text-muted-foreground">Sign out of this device</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-xs text-muted-foreground">Permanently delete all data</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
