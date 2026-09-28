import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  videoUrl: string;
  autoFullscreen?: boolean;
}

export default function VideoPlayer({
  videoUrl,
  autoFullscreen = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Initiate fullscreen and playback when autoFullscreen is requested (e.g. from Episode Grid)
  useEffect(() => {
    if (!autoFullscreen) return;

    // Start playing
    setPlaying(true);

    const requestFullscreenOnContainer = () => {
      const container = containerRef.current;
      if (container && !document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch((err) => {
            console.log("Auto-fullscreen waiting for interaction:", err);
          });
        }
      }
    };

    // Attempt immediately upon mounting
    requestFullscreenOnContainer();

    // Fallback: If browser policy blocks immediate fullscreen without gesture, trigger on first interaction
    const handleFirstInteraction = () => {
      requestFullscreenOnContainer();
      setPlaying(true);
      window.removeEventListener("click", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
    };

    window.addEventListener("click", handleFirstInteraction, { capture: true, once: true });
    window.addEventListener("keydown", handleFirstInteraction, { capture: true, once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
    };
  }, [autoFullscreen, videoUrl]);

  const handleSeekStart = () => {
    setWasPlaying(playing);

    if (playing) {
      setPlaying(false);
    }
  };

  const handleSeekEnd = () => {
    if (wasPlaying) {
      setPlaying(true);
    }
  };

  return (
    <div className="video-player-wrapper">
      <div
        ref={containerRef}
        className={`video-player-container ${isFullscreen ? "fullscreen" : ""}`}
      >
        <ReactPlayer
          src={videoUrl}
          playing={playing}
          controls
          playsInline
          width="100%"
          height="100%"
          className="react-player"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onSeeked={handleSeekEnd}
          onSeeking={handleSeekStart}
        />
      </div>
    </div>
  );
}             
