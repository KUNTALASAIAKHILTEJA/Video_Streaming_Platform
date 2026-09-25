import { Link } from "react-router-dom";
import type { Episode } from "../../types/media";
import "./EpisodeCard.css";
import stockImage from "../../assets/images/stock-image.jpg";

interface EpisodeCardProps {
  episode: Episode;
  showId: number;
  seasonNumber: number;
  state?: any;
}

export default function EpisodeCard({
  episode,
  showId,
  seasonNumber,
  state,
}: EpisodeCardProps) {
  // Fallback to stockImage
  const imageSrc = stockImage;

  return (
    <Link
      to={`/player/${showId}/${seasonNumber}/${episode.episodeNumber}`}
      state={state}
      className="episode-card"
    >
      <div className="episode-card-thumbnail-wrapper">
        <img
          src={imageSrc}
          alt={episode.title}
          className="episode-card-thumbnail"
        />
        <div className="episode-card-play-overlay">
          <span className="episode-card-play-icon">▶</span>
        </div>
        <div className="episode-card-number-badge">
          {episode.episodeNumber}
        </div>
        <div className="episode-card-duration">{episode.duration}</div>
      </div>
      <div className="episode-card-content">
        <h4 className="episode-card-title">
          Ep {episode.episodeNumber}: {episode.title}
        </h4>
        <p className="episode-card-description">{episode.description}</p>
      </div>
    </Link>
  );
}
