import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Upload, Brain, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  {
    icon: Mic,
    color: "bg-primary/10 text-primary",
    title: "Welcome to MeetingMind",
    description: "Your AI-powered meeting intelligence platform. Turn any meeting recording into transcripts, action items, summaries, and insights — automatically.",
  },
  {
    icon: Upload,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    title: "Upload or Record",
    description: "Upload an existing audio/video file (MP3, MP4, WAV, M4A) or record a live meeting directly in your browser. Both work offline too.",
  },
  {
    icon: Brain,
    color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    title: "AI Does the Heavy Lifting",
    description: "Gemini AI automatically transcribes your meeting, identifies speakers, extracts action items and decisions, and scores meeting health.",
  },
  {
    icon: CheckCircle,
    color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    title: "You're Ready!",
    description: "Upload your first meeting to get started. Use Guest Mode to explore with demo data, or sign in with your account to save everything.",
  },
];

const STORAGE_KEY = "meetingmind_onboarded";

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setOpen(true);
  }, [user]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${current.color}`}>
            <Icon className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            <Button className="flex-1" onClick={handleNext}>
              {isLast ? (
                "Get Started"
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
