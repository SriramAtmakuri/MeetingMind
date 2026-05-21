import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { uploadApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface UploadDialogProps {
  trigger?: React.ReactNode;
  onUploadComplete?: (meetingId: string) => void;
}

export function UploadDialog({ trigger, onUploadComplete }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const ALLOWED_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-m4a',
    'video/mp4',
    'video/webm',
    'audio/webm'
  ];

  const MAX_SIZE = 500 * 1024 * 1024; // 500MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Invalid file type. Allowed: MP3, MP4, WAV, M4A, WebM");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_SIZE) {
      setError("File size exceeds 500MB limit");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Auto-populate title from filename
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError("Please provide both a title and file");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      const result = await uploadApi.uploadFile(file, title.trim(), (prog) => {
        setProgress(prog);
      }, agenda.trim() || undefined);

      setSuccess(true);
      setProgress(100);

      // Wait a moment to show success
      setTimeout(() => {
        setOpen(false);
        if (onUploadComplete) {
          onUploadComplete(result.meeting.id);
        } else {
          // Navigate to meeting detail or dashboard
          navigate(`/meeting/${result.meeting.id}`);
        }

        // Reset form
        setFile(null);
        setTitle("");
        setAgenda("");
        setProgress(0);
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!uploading) {
      setOpen(isOpen);
      if (!isOpen) {
        // Reset state when closing
        setFile(null);
        setTitle("");
        setAgenda("");
        setError("");
        setSuccess(false);
        setProgress(0);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Meeting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Meeting Recording</DialogTitle>
          <DialogDescription>
            Upload an audio or video file to process with AI
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title Input */}
          <div className="grid gap-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Q1 Strategy Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Agenda Input */}
          <div className="grid gap-2">
            <Label htmlFor="agenda">Agenda <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="agenda"
              placeholder="e.g., 1. Q1 review  2. Roadmap planning  3. Team updates"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              disabled={uploading}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* File Input */}
          <div className="grid gap-2">
            <Label htmlFor="file">Recording File</Label>

            {!file ? (
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  accept=".mp3,.mp4,.wav,.m4a,.webm"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: MP3, MP4, WAV, M4A, WebM (max 500MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <File className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress < 100 ? "Uploading..." : "Processing..."}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-success-light border border-success/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Upload successful!</p>
                <p className="text-xs text-muted-foreground">Redirecting...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Process
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
