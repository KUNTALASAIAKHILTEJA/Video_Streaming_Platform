import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useShows } from "../../contexts/ShowContext";
import SeasonSelector from "../../components/SeasonSelector/SeasonSelector";
import "./EpisodeGrid.css";

export default function EpisodeGrid() {
  const { showId } = useParams<{ showId: string }>();
  const { shows, loading } = useShows();
  const location = useLocation();
  const show = shows.find((s) => s.id === Number(showId));

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);

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
      <Link to={backTo} className="back-to-home-btn">
        {backLabel}
      </Link>

      <div className="episode-grid-content">
        <div className="details-header-row">
          <h2 className="details-page-title">Episodes</h2>
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
    </div>
  );
}