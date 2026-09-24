import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  videoUrl: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast = entry.boundingClientRect.top < 0;
        if (!entry.isIntersecting && scrolledPast) {
          setIsMinimized(true);
        } else if (entry.isIntersecting) {
          setIsMinimized(false);
          setIsDismissed(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide control bar when playing and inactive
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleSeekStart = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      if (typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(time, "seconds");
      } else if (playerRef.current.currentTime !== undefined) {
        playerRef.current.currentTime = time;
      }
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleManualMinimize = () => {
    setIsMinimized((prev) => !prev);
    setIsDismissed(false);
  };

  const handleRestoreMiniPlayer = () => {
    setIsMinimized(false);
    wrapperRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showMiniPlayer = isMinimized && !isDismissed && !isFullscreen;

  return (
    <div className="video-player-wrapper" ref={wrapperRef}>
      <div
        ref={containerRef}
        className={`video-player-container ${showMiniPlayer ? "minimized" : ""} ${
          isFullscreen ? "fullscreen" : ""
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Mini Player Header Bar */}
        {showMiniPlayer && (
          <div className="mini-player-header">
            <span className="mini-player-label">Now Playing (Mini Player)</span>
            <div className="mini-player-actions">
              <button
                type="button"
                className="mini-player-btn"
                onClick={handleRestoreMiniPlayer}
                title="Restore full player"
              >
                ⤢
              </button>
              <button
                type="button"
                className="mini-player-btn"
                onClick={() => setIsDismissed(true)}
                title="Close mini player"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {(() => {
          const PlayerComponent = ReactPlayer as any;
          return (
            <PlayerComponent
              ref={playerRef}
              url={videoUrl}
              src={videoUrl}
              controls={false}
              playing={isPlaying}
              volume={volume}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onProgress={(progress: any) => {
                if (progress && typeof progress.playedSeconds === "number") {
                  setCurrentTime(progress.playedSeconds);
                }
              }}
              onDuration={(dur: number) => setDuration(dur)}
              onLoadedMetadata={(e: any) => {
                if (e?.target?.duration) setDuration(e.target.duration);
              }}
              width="100%"
              height="100%"
              className="react-player"
              onClick={togglePlay}
            />
          );
        })()}

        {/* Center Play Button Overlay when paused */}
        {!isPlaying && !showMiniPlayer && (
          <div className="big-play-overlay" onClick={togglePlay}>
            <button type="button" className="big-play-btn" aria-label="Play video">
              ▶
            </button>
          </div>
        )}

        {/* Integrated Player Control Bar */}
        {!showMiniPlayer && (
          <div className={`player-controls-bar ${showControls || !isPlaying ? "visible" : "hidden"}`}>
            <div className="controls-left">
              <button
                type="button"
                className="control-btn play-pause-btn"
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="controls-center">
              <input
                type="range"
                className="timeline-slider"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                title="Seek"
              />
            </div>

            <div className="controls-right">
              {/* Volume */}
              <div className="volume-control-group">
                <button
                  type="button"
                  className="control-btn volume-btn"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  title="Volume"
                />
              </div>

              {/* Minimizing Icon */}
              <button
                type="button"
                className="control-btn minimize-btn"
                onClick={handleManualMinimize}
                title="Minimize player"
                aria-label="Minimize player"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" fillOpacity="0.4" />
                </svg>
              </button>

              {/* Fullscreen Option */}
              <button
                type="button"
                className="control-btn fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                aria-label="Fullscreen"
              >
                {isFullscreen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
