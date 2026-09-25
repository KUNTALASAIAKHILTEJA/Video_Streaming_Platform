import React, { useState, useEffect, useRef, useCallback } from "react";
import "./VideoPlayer.css";

interface VideoPlayerProps {
  videoUrl: string;
  autoFullscreen?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function VideoPlayer({ videoUrl, autoFullscreen = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Dragging / Scrubbing state
  const isDraggingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);

  // Auto-hide control bar when playing and inactive
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isDraggingRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // IntersectionObserver for auto-minimizing on scroll
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-initiate fullscreen and playback when navigated from episode grid
  useEffect(() => {
    if (!autoFullscreen) return;

    const requestFullscreenOnContainer = () => {
      const container = containerRef.current;
      if (container && !document.fullscreenElement) {
        container.requestFullscreen?.().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.log("Auto-fullscreen waiting for user interaction:", err);
        });
      }
    };

    // Attempt immediately (React Router link click counts as user gesture)
    requestFullscreenOnContainer();

    // Also auto-play video
    const video = videoRef.current;
    if (video) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    // Fallback: If browser deferred fullscreen request, trigger on first document click/keydown
    const handleFirstInteraction = () => {
      requestFullscreenOnContainer();
      if (video && video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
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

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isDraggingRef.current) {
      setCurrentTime(video.currentTime);
    }

    // Update buffer progress
    if (video.buffered.length > 0) {
      try {
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(end);
      } catch {}
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // ─── Precision Seek & Play Logic ──────────────────────────────────────────

  const performSeek = useCallback((time: number, autoPlay: boolean = true) => {
    const video = videoRef.current;
    if (!video) return;

    const maxDuration = video.duration || duration || time;
    const safeTime = Math.max(0, Math.min(time, maxDuration));

    // Synchronously set video position and component state
    video.currentTime = safeTime;
    setCurrentTime(safeTime);

    if (autoPlay) {
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        setIsPlaying(true);
      }
    }
  }, [duration]);

  const getTimeFromClientX = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const effectiveDuration = videoRef.current?.duration || duration || 0;
    return fraction * effectiveDuration;
  }, [duration]);

  // Pointer Handlers for Timeline
  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const targetTime = getTimeFromClientX(e.clientX);
    performSeek(targetTime, true);
  };

  const handleTimelinePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const targetTime = getTimeFromClientX(e.clientX);

    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(1, clickX / rect.width));
      setHoverPos(fraction * 100);
      setHoverTime(targetTime);
    }

    if (isDraggingRef.current) {
      setCurrentTime(targetTime);
      const video = videoRef.current;
      if (video) {
        video.currentTime = targetTime;
      }
    }
  };

  const handleTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const targetTime = getTimeFromClientX(e.clientX);
      performSeek(targetTime, true);

      setTimeout(() => {
        isDraggingRef.current = false;
        setIsDragging(false);
      }, 100);

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    resetControlsTimeout();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      performSeek(Math.max(0, currentTime - 5), true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      performSeek(Math.min(duration, currentTime + 5), true);
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleMute();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      toggleFullscreen();
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
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const bufferedPercent = duration > 0 ? Math.min(100, Math.max(0, (bufferedEnd / duration) * 100)) : 0;

  return (
    <div className="video-player-wrapper" ref={wrapperRef}>
      <div
        ref={containerRef}
        className={`video-player-container ${showMiniPlayer ? "is-minimized" : ""} ${
          isFullscreen ? "fullscreen" : ""
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Mini Player Header Bar */}
        {showMiniPlayer && (
          <div className="mini-player-bar">
            <span className="mini-player-title">Now Playing (Mini Player)</span>
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

        {/* Direct HTML5 Video Player */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="react-player-native"
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
        />

        {/* Big Center Play Button Overlay when paused */}
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

            {/* Custom Precision Timeline Scrubber Bar */}
            <div className="controls-center">
              <div
                ref={timelineRef}
                className={`custom-timeline-container ${isDragging ? "is-dragging" : ""}`}
                onPointerDown={handleTimelinePointerDown}
                onPointerMove={handleTimelinePointerMove}
                onPointerUp={handleTimelinePointerUp}
                onPointerCancel={handleTimelinePointerUp}
                onPointerLeave={() => setHoverTime(null)}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={duration || 100}
                aria-valuenow={currentTime}
                title="Tap or drag to seek"
              >
                {/* Hover Timestamp Tooltip */}
                {hoverTime !== null && duration > 0 && (
                  <div
                    className="timeline-hover-tooltip"
                    style={{ left: `${hoverPos}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}

                <div className="timeline-track-rail">
                  {/* Buffered Track Fill */}
                  <div
                    className="timeline-track-buffered"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                  {/* Played Track Fill */}
                  <div
                    className="timeline-track-played"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Scrubber Knob Handle */}
                  <div
                    className="timeline-scrubber-handle"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
              </div>
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
