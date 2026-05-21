import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mic,
  Search,
  CheckSquare,
  Menu,
  Zap,
  Link as LinkIcon,
  Shield,
  Trophy,
  BarChart3,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Keyboard,
} from "lucide-react";
import { UploadDialog } from "@/components/UploadDialog";
import RecordingDialog from "@/components/RecordingDialog";
import NotificationsBell from "@/components/NotificationsBell";
import { useAuth } from "@/contexts/AuthContext";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "@/hooks/useKeyboardShortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS_LIST = [
  { keys: "/", description: "Focus search" },
  { keys: "N", description: "Upload new meeting" },
  { keys: "D", description: "Go to dashboard" },
  { keys: "?", description: "Show keyboard shortcuts" },
  { keys: "Esc", description: "Close dialog / modal" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("meetingmind_theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("meetingmind_theme", dark ? "dark" : "light");
  }, [dark]);

  useKeyboardShortcuts([
    {
      key: "?",
      shiftKey: true,
      handler: () => setShortcutsOpen(true),
      description: COMMON_SHORTCUTS.HELP.description,
    },
    {
      key: "d",
      handler: () => navigate("/dashboard"),
      description: COMMON_SHORTCUTS.DASHBOARD.description,
    },
    {
      key: "/",
      handler: () => navigate("/search"),
      description: COMMON_SHORTCUTS.SEARCH.description,
    },
  ]);

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">MeetingMind</h1>
            </Link>

            <div className="flex items-center gap-2">
              {/* Pages menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" title="More pages">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/templates")}>
                    <Zap className="w-4 h-4 mr-2" />
                    Smart Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/integrations")}>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Integrations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/privacy")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy & Compliance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/achievements")}>
                    <Trophy className="w-4 h-4 mr-2" />
                    Achievements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/analytics")}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Visual Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                    <Keyboard className="w-4 h-4 mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/action-items")}
                title="Action items"
              >
                <CheckSquare className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/search")}
                title="Search (press /)"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDark((d) => !d)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <NotificationsBell userId={user?.id} />

              <Button
                onClick={() => setRecordingDialogOpen(true)}
                className="gap-2"
              >
                <Mic className="w-5 h-5" />
                <span className="hidden sm:inline">Record</span>
              </Button>

              <UploadDialog />

              {/* User profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" title="Profile">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user && (
                    <>
                      <div className="px-3 py-2">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.isGuest && (
                          <p className="text-xs text-amber-600 mt-1">Guest session</p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile & Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
                    <Keyboard className="w-4 h-4 mr-2" />
                    Keyboard Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <RecordingDialog
        open={recordingDialogOpen}
        onOpenChange={setRecordingDialogOpen}
      />

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {SHORTCUTS_LIST.map((s) => (
              <div key={s.keys} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{s.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
