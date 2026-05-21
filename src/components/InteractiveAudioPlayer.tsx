import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Languages,
} from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

interface TranscriptSegment {
  id: string;
  speaker_id: string;
  text: string;
  start_time: number;
  end_time: number;
  speaker_name?: string;
  speaker_color?: string;
}

interface InteractiveAudioPlayerProps {
  audioUrl?: string;
  transcript: TranscriptSegment[];
  speakers?: any[];
}

const InteractiveAudioPlayer = ({
  audioUrl,
  transcript = [],
  speakers = [],
}: InteractiveAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock audio URL if not provided
  const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Find active segment
      const segment = transcript.find(
        (seg) => audio.currentTime >= seg.start_time && audio.currentTime <= seg.end_time
      );
      if (segment) {
        setActiveSegmentId(segment.id);

        // Auto-scroll to active segment
        const element = document.getElementById(`segment-${segment.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [transcript]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const changePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const jumpToSegment = (segment: TranscriptSegment) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = segment.start_time;
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const getSpeakerInfo = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker || { name: `Speaker ${speakerId}`, color: "#gray" };
  };

  const availableLanguages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
  ];

  return (
    <div className="space-y-6">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl || mockAudioUrl}
        preload="metadata"
      />

      {/* Player Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTimestamp(currentTime)}</span>
              <span>{formatTimestamp(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={skipBackward}
                className="h-10 w-10"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={skipForward}
                className="h-10 w-10"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={changePlaybackRate}
                className="ml-2"
              >
                {playbackRate}x
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm bg-transparent border rounded px-2 py-1"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Wave Visualization (Simplified) */}
          <div className="h-16 bg-muted/50 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center gap-1 px-2">
              {Array.from({ length: 100 }).map((_, i) => {
                const height = Math.random() * 60 + 20;
                const isActive = (currentTime / duration) * 100 > i;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all ${
                      isActive ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Transcript */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Interactive Transcript</h3>
            <Badge variant="secondary">{transcript.length} segments</Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            Click any segment to jump to that moment in the recording
          </p>

          <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
            <div className="space-y-3">
              {transcript.map((segment) => {
                const speaker = getSpeakerInfo(segment.speaker_id);
                const isActive = activeSegmentId === segment.id;

                return (
                  <div
                    key={segment.id}
                    id={`segment-${segment.id}`}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/10 border-2 border-primary shadow-md scale-[1.02]"
                        : "bg-muted/50 hover:bg-muted border-2 border-transparent hover:shadow"
                    }`}
                    onClick={() => jumpToSegment(segment)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                        style={{ backgroundColor: segment.speaker_color || speaker.color }}
                      >
                        {(segment.speaker_name || speaker.name)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm">
                            {segment.speaker_name || speaker.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary/10"
                          >
                            {formatTimestamp(segment.start_time)}
                          </Badge>
                          {isActive && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              <span className="text-xs text-primary font-medium">
                                Playing
                              </span>
                            </div>
                          )}
                        </div>

                        <p className={`text-sm leading-relaxed ${isActive ? "font-medium" : ""}`}>
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {transcript.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No transcript available. Upload a recording to generate transcript.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Keyboard Shortcuts Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          ⌨️ <strong>Keyboard Shortcuts:</strong> Space = Play/Pause, ← = -10s, → = +10s,
          ↑ = Volume Up, ↓ = Volume Down. Click any transcript segment to jump to that moment.
          Change playback speed from 0.5x to 2x for faster/slower listening.
        </p>
      </Card>
    </div>
  );
};

export default InteractiveAudioPlayer;
