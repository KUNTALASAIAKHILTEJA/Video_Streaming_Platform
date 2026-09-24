import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useShows } from "../../contexts/ShowContext";
import { useAuth } from "../../contexts/AuthContext";
import SeasonSelector from "../../components/SeasonSelector/SeasonSelector";
import ShowModal from "../../components/ShowModal/ShowModal";
import "./EpisodeGrid.css";

export default function EpisodeGrid() {
  const { showId } = useParams<{ showId: string }>();
  const { shows, loading } = useShows();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const show = shows.find((s) => s.id === Number(showId));

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [showModalOpen, setShowModalOpen] = useState(false);

  const backTo = location.state?.from || "/";
  const backLabel = backTo === "/series" ? "← Series" : "← Dashboard";

  if (loading) {
    return (
      <div className="episode-grid-page">
        <div style={{ padding: "80px 60px", textAlign: "center" }}>
          <h2>Loading Show Details...</h2>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="episode-grid-error">
        <h2>Show not found</h2>
        <Link to={backTo} className="back-link">{backLabel}</Link>
      </div>
    );
  }

  const currentSeason = show.seasons.find(
    (s) => s.seasonNumber === selectedSeasonNumber
  ) || show.seasons[0];

  return (
    <div className="episode-grid-page">
      <div className="episode-grid-top-actions">
        <Link to={backTo} className="back-to-home-btn">
          {backLabel}
        </Link>
        {isAdmin && (
          <button
            className="manage-show-btn"
            onClick={() => setShowModalOpen(true)}
            title="Edit series, manage seasons, and upload episodes"
          >
            ⚙️ Edit Series & Episodes
          </button>
        )}
      </div>

      <div className="episode-grid-content">
        <div className="details-header-row">
          <h2 className="details-page-title">{show.title} - Episodes</h2>
          {show.seasons && show.seasons.length > 0 && (
            <SeasonSelector
              seasons={show.seasons}
              selectedSeasonNumber={selectedSeasonNumber}
              onSelectSeason={setSelectedSeasonNumber}
            />
          )}
        </div>

        <div className="episodes-grid-container">
          {!currentSeason || currentSeason.episodes.length === 0 ? (
            <div className="empty-episodes" style={{ color: "var(--text-muted)", marginTop: "20px" }}>
              <p>No episodes available for this season.</p>
              {isAdmin && (
                <button
                  className="add-first-episode-btn"
                  onClick={() => setShowModalOpen(true)}
                  style={{
                    marginTop: "12px",
                    background: "#e50914",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Upload Episode
                </button>
              )}
            </div>
          ) : (
            <div className="episodes-grid">
              {currentSeason.episodes.map((episode) => (
                <Link
                  key={episode.id}
                  to={`/player/${show.id}/${selectedSeasonNumber}/${episode.episodeNumber}`}
                  state={{ from: backTo }}
                  className="episode-number-card"
                  title={episode.title}
                >
                  {episode.episodeNumber}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <ShowModal
          isOpen={showModalOpen}
          onClose={() => setShowModalOpen(false)}
          mode="edit"
          show={show}
        />
      )}
    </div>
  );
}