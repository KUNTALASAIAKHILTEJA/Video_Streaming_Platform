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
  const [epDur, setEpDur] = useState(45);
  const [epVideoUrl, setEpVideoUrl] = useState("");
  const [epVideoFile, setEpVideoFile] = useState<File | undefined>(undefined);

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadedVideoName, setUploadedVideoName] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setEpDur(45);
        setEpVideoUrl("");
        setUploadedVideoName("");
        setEpVideoFile(undefined);
      }
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen, mode, episode]);

  if (!isOpen) return null;

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    setUploadingVideo(true);
    setVideoProgress(0);
    setUploadedVideoName(file.name);
    setEpVideoFile(file);

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

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const epData = {
      episodeNumber: Number(epNum),
      title: epTitle,
      description: epDesc,
      duration: Number(epDur),
      videoUrl: epVideoUrl || "",
      thumbnail: "/images/episode-placeholder.jpg",
    };

    try {
      if (mode === "add") {
        await addEpisode(showId, seasonNumber, epData, epVideoFile);
      } else if (mode === "edit" && episode) {
        await updateEpisode(showId, seasonNumber, episode.id, epData, epVideoFile);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Failed to save episode. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop sub-modal">
      <div className="modal-content episode-modal">
        <div className="modal-header">
          <h3>
            {mode === "add" ? "Add Episode" : "Edit Episode"} - Season {seasonNumber}
          </h3>
          <button className="close-modal-btn" onClick={onClose} disabled={saving}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveEpisode} className="modal-form">
          {saveError && (
            <div style={{
              background: "rgba(229, 9, 20, 0.15)",
              border: "1px solid #e50914",
              color: "#ff6b6b",
              padding: "10px 14px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "0.9rem"
            }}>
              ⚠️ {saveError}
            </div>
          )}
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
              <label htmlFor="epDur">Duration (minutes)</label>
              <input
                type="number"
                id="epDur"
                value={epDur}
                onChange={(e) => setEpDur(Number(e.target.value))}
                required
                min="1"
                placeholder="e.g. 45"
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : mode === "add" ? "Save Episode" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
