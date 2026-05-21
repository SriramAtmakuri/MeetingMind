import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { meetingsApi, uploadApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface RecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const RecordingDialog = ({ open, onOpenChange, trigger }: RecordingDialogProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; file: Blob; agenda?: string }) => {
      const file = new File([data.file], "recording.webm", { type: "audio/webm" });
      return uploadApi.uploadFile(file, data.title, undefined, data.agenda);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast({
        title: "Recording uploaded",
        description: "Your meeting is being processed. This may take a few minutes.",
      });
      handleClose();
      if (result?.meeting?.id) {
        navigate(`/meeting/${result.meeting.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone.",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record meetings.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast({
        title: "Recording paused",
      });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      toast({
        title: "Recording resumed",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast({
        title: "Recording stopped",
        description: "Review and upload your recording.",
      });
    }
  };

  const handleUpload = () => {
    if (!meetingTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a meeting title.",
        variant: "destructive",
      });
      return;
    }

    if (!audioBlob) {
      toast({
        title: "No recording",
        description: "Please record a meeting first.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ title: meetingTitle, file: audioBlob, agenda: meetingAgenda.trim() || undefined });
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setRecordingTime(0);
    setMeetingTitle("");
    setMeetingAgenda("");
    setAudioBlob(null);
    setAudioURL("");
    chunksRef.current = [];
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {trigger}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Meeting</DialogTitle>
          <DialogDescription>
            Record a live meeting or conversation to transcribe and analyze.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Team Standup"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              disabled={isRecording}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="agenda"
              placeholder="e.g., 1. Status updates  2. Blockers  3. Next steps"
              value={meetingAgenda}
              onChange={(e) => setMeetingAgenda(e.target.value)}
              disabled={isRecording}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-muted rounded-lg">
            <div className="text-4xl font-mono font-bold">
              {formatTime(recordingTime)}
            </div>

            {isRecording && !isPaused && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Recording...</span>
              </div>
            )}
            {isPaused && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Paused</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              {!isRecording && !audioBlob && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="w-32"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start
                </Button>
              )}

              {isRecording && !isPaused && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={pauseRecording}
                    className="w-32"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="w-32"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {isRecording && isPaused && (
                <>
                  <Button
                    size="lg"
                    onClick={resumeRecording}
                    className="w-32"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="w-32"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>

          {audioBlob && audioURL && (
            <div className="space-y-3">
              <Label>Recording Preview</Label>
              <audio controls src={audioURL} className="w-full" />
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
                size="lg"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Make sure your microphone is working properly</p>
            <p>• Speak clearly for better transcription accuracy</p>
            <p>• Recording will be processed after upload</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingDialog;
