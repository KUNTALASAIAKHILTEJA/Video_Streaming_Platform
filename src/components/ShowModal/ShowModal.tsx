import { useState, useEffect } from "react";
import { useShows } from "../../contexts/ShowContext";
import type { Show, Episode } from "../../types/media";
import EpisodeModal from "../EpisodeModal/EpisodeModal";

type Tab = "info" | "seasons";

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  show: Show | null;
}

export default function ShowModal({ isOpen, onClose, mode, show }: ShowModalProps) {
  const {
    shows,
    genres,
    addShow,
    updateShow,
    addSeason,
    deleteSeason,
    updateEpisode,
    deleteEpisode,
    createGenre,
  } = useShows();

  // Show form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [rating, setRating] = useState(8.0);
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>("info");

  // Create new genre states
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreSlug, setNewGenreSlug] = useState("");
  const [newGenreDesc, setNewGenreDesc] = useState("");
  const [showCreateGenreForm, setShowCreateGenreForm] = useState(false);

  // Upload progress states
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterProgress, setPosterProgress] = useState(0);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [backdropProgress, setBackdropProgress] = useState(0);
  // Store actual File objects for upload
  const [posterFile, setPosterFile] = useState<File | undefined>(undefined);
  const [backdropFile, setBackdropFile] = useState<File | undefined>(undefined);

  // Inline upload states for seasons manager
  const [inlineProgress, setInlineProgress] = useState<Record<number, number>>({});
  const [inlineUploading, setInlineUploading] = useState<Record<number, boolean>>({});
  const [inlineVideoFiles, setInlineVideoFiles] = useState<Record<number, File>>({});

  // Episode modal state (nested)
  const [epModalOpen, setEpModalOpen] = useState(false);
  const [epModalMode, setEpModalMode] = useState<"add" | "edit">("add");
  const [targetSeasonNum, setTargetSeasonNum] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Save and submission state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeEditingShow = show ? shows.find((s) => s.id === show.id) || show : null;

  // Sync state with selected show
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && show) {
        setTitle(show.title);
        setDescription(show.description);
        setPoster(show.poster);
        setBackdrop(show.backdrop);
        setSelectedGenres(show.genre);
        setRating(show.rating);
        setReleaseYear(show.releaseYear);
      } else {
        setTitle("");
        setDescription("");
        setPoster("");
        setBackdrop("");
        setSelectedGenres(["Drama", "Adventure"]);
        setRating(8.0);
        setReleaseYear(new Date().getFullYear());
      }
      setActiveTab("info");
      setShowCreateGenreForm(false);
      setNewGenreName("");
      setNewGenreSlug("");
      setNewGenreDesc("");
      // Reset file state and errors on modal open
      setPosterFile(undefined);
      setBackdropFile(undefined);
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen, mode, show]);

  if (!isOpen) return null;

  // File Upload Handler – stores the raw File and generates a preview URL
  const handleFileUpload = (
    file: File,
    type: "poster" | "backdrop",
    onComplete: (url: string) => void,
    setFileState: (f: File) => void
  ) => {
    if (type === "poster") {
      setUploadingPoster(true);
      setPosterProgress(0);
    } else if (type === "backdrop") {
      setUploadingBackdrop(true);
      setBackdropProgress(0);
    }

    setFileState(file);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        const reader = new FileReader();
        reader.onloadend = () => {
          onComplete(reader.result as string);
          if (type === "poster") setUploadingPoster(false);
          if (type === "backdrop") setUploadingBackdrop(false);
        };
        reader.readAsDataURL(file);
      }

      if (type === "poster") setPosterProgress(progress);
      else if (type === "backdrop") setBackdropProgress(progress);
    }, 60);
  };

  // Inline Video Upload Handler – stores the File and sends to backend
  const handleInlineVideoUpload = (file: File, seasonNumber: number, episode: Episode) => {
    const epId = episode.id;
    setInlineUploading((prev) => ({ ...prev, [epId]: true }));
    setInlineProgress((prev) => ({ ...prev, [epId]: 0 }));
    setInlineVideoFiles((prev) => ({ ...prev, [epId]: file }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        if (show) {
          const objectUrl = URL.createObjectURL(file);
          updateEpisode(show.id, seasonNumber, epId, { videoUrl: objectUrl }, inlineVideoFiles[epId] || file);
        }
        setInlineUploading((prev) => ({ ...prev, [epId]: false }));
      }
      setInlineProgress((prev) => ({ ...prev, [epId]: progress }));
    }, 60);
  };

  const handleCreateGenre = async () => {
    if (!newGenreName || !newGenreSlug || !newGenreDesc) return;
    try {
      const sanitizedSlug = newGenreSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      await createGenre({
        name: newGenreName,
        slug: sanitizedSlug,
        description: newGenreDesc,
      });
      // Automatically select the newly created genre
      setSelectedGenres((prev) => [...prev, newGenreName]);
      // Reset form
      setNewGenreName("");
      setNewGenreSlug("");
      setNewGenreDesc("");
      setShowCreateGenreForm(false);
    } catch (err) {
      alert("Failed to create genre. Please check backend validation rules.");
    }
  };

  const handleSaveShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const showData = {
      title,
      description,
      poster,
      backdrop,
      genre: selectedGenres,
      rating: Number(rating),
      releaseYear: Number(releaseYear),
    };

    try {
      if (mode === "add") {
        await addShow(showData, posterFile, backdropFile);
      } else if (mode === "edit" && show) {
        await updateShow(show.id, showData, posterFile, backdropFile);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Failed to save series. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddEpisode = (seasonNum: number) => {
    setEpModalMode("add");
    setTargetSeasonNum(seasonNum);
    setSelectedEpisode(null);
    setEpModalOpen(true);
  };

  const handleOpenEditEpisode = (seasonNum: number, episode: Episode) => {
    setEpModalMode("edit");
    setTargetSeasonNum(seasonNum);
    setSelectedEpisode(episode);
    setEpModalOpen(true);
  };

  const handleDeleteEpisode = (seasonNum: number, episodeId: number, epTitle: string) => {
    if (!show) return;
    if (window.confirm(`Are you sure you want to delete episode "${epTitle}"?`)) {
      deleteEpisode(show.id, seasonNum, episodeId);
    }
  };

  const handleAddSeason = () => {
    if (!show) return;
    addSeason(show.id);
  };

  const handleDeleteSeason = (seasonNum: number) => {
    if (!show) return;
    if (window.confirm(`Are you sure you want to delete Season ${seasonNum} and all its episodes?`)) {
      deleteSeason(show.id, seasonNum);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content show-modal">
        <div className="modal-header">
          <h3>{mode === "add" ? "Add New Series" : `Edit: ${title}`}</h3>
          <button className="close-modal-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {mode === "edit" && (
          <div className="modal-tabs">
            <button
              className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Show Info
            </button>
            <button
              className={`tab-btn ${activeTab === "seasons" ? "active" : ""}`}
              onClick={() => setActiveTab("seasons")}
            >
              Seasons & Episodes ({activeEditingShow?.seasons.length || 0})
            </button>
          </div>
        )}

        {activeTab === "info" ? (
          <form onSubmit={handleSaveShow} className="modal-form">
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
            <div className="form-group">
              <label htmlFor="title">Series Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter series title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter synopsis"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="releaseYear">Release Year</label>
                <input
                  type="number"
                  id="releaseYear"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="rating">Rating (0 - 10)</label>
                <input
                  type="number"
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  min="0"
                  max="10"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Genres</label>
              <div className="genre-selection-grid">
                {(() => {
                  const defaultGenres = ["Drama", "Adventure", "Sci-Fi", "Action", "Comedy", "Thriller"];
                  const availableGenres = [...genres];
                  defaultGenres.forEach(name => {
                    if (!availableGenres.some(g => g.name.toLowerCase() === name.toLowerCase())) {
                      availableGenres.push({
                        id: -Math.floor(Math.random() * 100000),
                        name,
                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        description: `${name} series.`
                      });
                    }
                  });
                  return availableGenres.map((g) => {
                    const isSelected = selectedGenres.includes(g.name);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        className={`genre-badge-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedGenres((prev) =>
                            prev.includes(g.name)
                              ? prev.filter((name) => name !== g.name)
                              : [...prev, g.name]
                          );
                        }}
                      >
                        {g.name}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                type="button"
                className="toggle-create-genre-btn"
                onClick={() => setShowCreateGenreForm(!showCreateGenreForm)}
              >
                {showCreateGenreForm ? "✕ Cancel Registering Genre" : "+ Register New Genre"}
              </button>

              {showCreateGenreForm && (
                <div className="create-genre-inline-form">
                  <h4>Register New Genre</h4>
                  <div className="form-group mini">
                    <label htmlFor="newGenreName">Genre Name</label>
                    <input
                      type="text"
                      id="newGenreName"
                      value={newGenreName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewGenreName(val);
                        setNewGenreSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                      }}
                      placeholder="e.g. Science Fiction"
                    />
                  </div>
                  <div className="form-group mini">
                    <label htmlFor="newGenreSlug">Slug</label>
                    <input
                      type="text"
                      id="newGenreSlug"
                      value={newGenreSlug}
                      onChange={(e) => setNewGenreSlug(e.target.value)}
                      placeholder="e.g. science-fiction"
                    />
                  </div>
                  <div className="form-group mini">
                    <label htmlFor="newGenreDesc">Description</label>
                    <textarea
                      id="newGenreDesc"
                      value={newGenreDesc}
                      onChange={(e) => setNewGenreDesc(e.target.value)}
                      placeholder="e.g. Movies and series based on futuristic concepts."
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary register-genre-action-btn"
                    onClick={handleCreateGenre}
                    disabled={!newGenreName || !newGenreSlug || !newGenreDesc}
                  >
                    Save Genre
                  </button>
                </div>
              )}
            </div>

            {/* Direct Poster Upload */}
            <div className="form-group">
              <label>Poster Image</label>
              <div className="upload-container">
                {poster && !uploadingPoster ? (
                  <div className="upload-preview-container">
                    <img src={poster} alt="Poster Preview" className="upload-preview" />
                    <div className="preview-action-row">
                      <label className="replace-upload-label">
                        Replace Poster
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "poster", setPoster, setPosterFile);
                            }
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button type="button" className="remove-preview-btn" onClick={() => setPoster("")}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : uploadingPoster ? (
                  <div className="upload-progress-container">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-fill" style={{ width: `${posterProgress}%` }}></div>
                    </div>
                    <p>Uploading Poster... {posterProgress}%</p>
                  </div>
                ) : (
                  <label className="upload-dropzone">
                    <p className="upload-icon">📁</p>
                    <p className="upload-text">Click or Drag Image to Upload Poster</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "poster", setPoster, setPosterFile);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Direct Backdrop Upload */}
            <div className="form-group">
              <label>Backdrop Image</label>
              <div className="upload-container">
                {backdrop && !uploadingBackdrop ? (
                  <div className="upload-preview-container backdrop-preview-container">
                    <img src={backdrop} alt="Backdrop Preview" className="upload-preview backdrop-preview" />
                    <div className="preview-action-row">
                      <label className="replace-upload-label">
                        Replace Backdrop
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "backdrop", setBackdrop, setBackdropFile);
                            }
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button type="button" className="remove-preview-btn" onClick={() => setBackdrop("")}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : uploadingBackdrop ? (
                  <div className="upload-progress-container">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-fill" style={{ width: `${backdropProgress}%` }}></div>
                    </div>
                    <p>Uploading Backdrop... {backdropProgress}%</p>
                  </div>
                ) : (
                  <label className="upload-dropzone">
                    <p className="upload-icon">🖼️</p>
                    <p className="upload-text">Click or Drag Image to Upload Backdrop</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0], "backdrop", setBackdrop, setBackdropFile);
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
                {saving ? "Saving..." : mode === "add" ? "Create Series" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="seasons-manager">
            <div className="manager-header">
              <h4>Seasons List</h4>
              <button className="add-season-btn" onClick={handleAddSeason}>
                + Add Season
              </button>
            </div>

            {activeEditingShow?.seasons.length === 0 ? (
              <p className="no-items-message">No seasons added yet. Click "+ Add Season" above.</p>
            ) : (
              <div className="seasons-accordion">
                {activeEditingShow?.seasons.map((season) => (
                  <div className="season-item" key={season.id}>
                    <div className="season-item-header">
                      <h5>Season {season.seasonNumber} ({season.episodes.length} Episodes)</h5>
                      <div className="season-actions">
                        <button
                          className="add-ep-trigger-btn"
                          onClick={() => handleOpenAddEpisode(season.seasonNumber)}
                        >
                          + Add Episode
                        </button>
                        <button
                          className="delete-season-btn"
                          onClick={() => handleDeleteSeason(season.seasonNumber)}
                        >
                          Delete Season
                        </button>
                      </div>
                    </div>

                    <div className="episodes-list">
                      {season.episodes.length === 0 ? (
                        <p className="no-items-message mini">No episodes in this season yet.</p>
                      ) : (
                        season.episodes.map((ep) => (
                          <div className="episode-item" key={ep.id}>
                            <p className="ep-badge">Ep {ep.episodeNumber}</p>
                            <p className="ep-title">{ep.title}</p>
                            <p className="ep-duration">({ep.duration} min)</p>
                            
                            {/* Inline Video Upload Trigger / Status */}
                            <div className="inline-upload-section">
                              {inlineUploading[ep.id] ? (
                                <div className="inline-upload-progress">
                                  <div
                                    className="inline-progress-fill"
                                    style={{ width: `${inlineProgress[ep.id]}%` }}
                                  ></div>
                                  <p className="inline-progress-text">{inlineProgress[ep.id]}%</p>
                                </div>
                              ) : ep.videoUrl && ep.videoUrl.startsWith("blob:") ? (
                                <div className="inline-video-status">
                                  <p className="video-badge-success">🎬 Active</p>
                                  <label className="inline-replace-icon" title="Replace Video Source">
                                    🔄
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleInlineVideoUpload(e.target.files[0], season.seasonNumber, ep);
                                        }
                                      }}
                                      style={{ display: "none" }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="inline-upload-btn">
                                  📤 Upload Video
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleInlineVideoUpload(e.target.files[0], season.seasonNumber, ep);
                                      }
                                    }}
                                    style={{ display: "none" }}
                                  />
                                </label>
                              )}
                            </div>

                            <div className="episode-actions">
                              <button
                                className="ep-action-btn edit"
                                onClick={() => handleOpenEditEpisode(season.seasonNumber, ep)}
                                title="Edit Episode Details"
                              >
                                ✏️
                              </button>
                              <button
                                className="ep-action-btn delete"
                                onClick={() => handleDeleteEpisode(season.seasonNumber, ep.id, ep.title)}
                                title="Delete Episode"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Episode modal nested internally */}
      {show && targetSeasonNum !== null && (
        <EpisodeModal
          isOpen={epModalOpen}
          onClose={() => setEpModalOpen(false)}
          mode={epModalMode}
          showId={show.id}
          seasonNumber={targetSeasonNum}
          episode={selectedEpisode}
        />
      )}
    </div>
  );
}
