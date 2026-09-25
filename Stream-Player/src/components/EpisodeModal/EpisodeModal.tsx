import { useState, useEffect } from "react";
import { useShows } from "../../contexts/ShowContext";
import type { Episode } from "../../types/media";

interface EpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  showId: number;
  seasonNumber: number;
  episode: Episode | null;
}

export default function EpisodeModal({
  isOpen,
  onClose,
  mode,
  showId,
  seasonNumber,
  episode,
}: EpisodeModalProps) {
  const { addEpisode, updateEpisode } = useShows();

  // Episode form state
  const [epNum, setEpNum] = useState(1);
  const [epTitle, setEpTitle] = useState("");
  const [epDesc, setEpDesc] = useState("");
  const [epDur, setEpDur] = useState("45 min");
  const [epVideoUrl, setEpVideoUrl] = useState("");

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadedVideoName, setUploadedVideoName] = useState("");

  // Sync state with selected episode
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && episode) {
        setEpNum(episode.episodeNumber);
        setEpTitle(episode.title);
        setEpDesc(episode.description);
        setEpDur(episode.duration);
        setEpVideoUrl(episode.videoUrl);
        setUploadedVideoName(episode.videoUrl.startsWith("blob:") ? "Custom Video Source Bound" : "");
      } else {
        setEpNum(1);
        setEpTitle("");
        setEpDesc("");
        setEpDur("45 min");
        setEpVideoUrl("");
        setUploadedVideoName("");
      }
    }
  }, [isOpen, mode, episode]);

  if (!isOpen) return null;

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    setUploadingVideo(true);
    setVideoProgress(0);
    setUploadedVideoName(file.name);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        const objectUrl = URL.createObjectURL(file);
        setEpVideoUrl(objectUrl);
        setUploadingVideo(false);
      }
      setVideoProgress(progress);
    }, 60);
  };

  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();

    const epData = {
      episodeNumber: Number(epNum),
      title: epTitle,
      description: epDesc,
      duration: epDur,
      videoUrl: epVideoUrl || "/videos/placeholder.mp4",
      thumbnail: "/images/episode-placeholder.jpg",
    };

    if (mode === "add") {
      addEpisode(showId, seasonNumber, epData);
    } else if (mode === "edit" && episode) {
      updateEpisode(showId, seasonNumber, episode.id, epData);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop sub-modal">
      <div className="modal-content episode-modal">
        <div className="modal-header">
          <h3>
            {mode === "add" ? "Add Episode" : "Edit Episode"} - Season {seasonNumber}
          </h3>
          <button className="close-modal-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveEpisode} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="epNum">Episode Number</label>
              <input
                type="number"
                id="epNum"
                value={epNum}
                onChange={(e) => setEpNum(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="epDur">Duration</label>
              <input
                type="text"
                id="epDur"
                value={epDur}
                onChange={(e) => setEpDur(e.target.value)}
                required
                placeholder="e.g. 45 min"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="epTitle">Episode Title</label>
            <input
              type="text"
              id="epTitle"
              value={epTitle}
              onChange={(e) => setEpTitle(e.target.value)}
              required
              placeholder="e.g. The Awakening"
            />
          </div>

          <div className="form-group">
            <label htmlFor="epDesc">Episode Synopsis</label>
            <textarea
              id="epDesc"
              value={epDesc}
              onChange={(e) => setEpDesc(e.target.value)}
              required
              placeholder="Enter synopsis"
              rows={2}
            />
          </div>

          {/* Direct Video File Upload */}
          <div className="form-group">
            <label>Video File Source</label>
            <div className="upload-container">
              {epVideoUrl && !uploadingVideo ? (
                <div className="upload-preview-container video-preview-container">
                  <div className="video-file-info">
                    <p className="video-icon">🎬</p>
                    <p className="video-name">{uploadedVideoName || "Video File Bound"}</p>
                  </div>
                  <div className="video-action-buttons">
                    <label className="replace-upload-label replace-video-label">
                      Replace Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                    <button
                      type="button"
                      className="remove-preview-btn remove-video-btn"
                      onClick={() => {
                        setEpVideoUrl("");
                        setUploadedVideoName("");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : uploadingVideo ? (
                <div className="upload-progress-container">
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-fill" style={{ width: `${videoProgress}%` }}></div>
                  </div>
                  <p>Uploading Video File... {videoProgress}%</p>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <p className="upload-icon">🎥</p>
                  <p className="upload-text">Click or Drag Video to Upload (MP4/WebM)</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Episode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
