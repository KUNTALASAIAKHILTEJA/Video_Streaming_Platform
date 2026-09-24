import { Link } from "react-router-dom";
import type { Episode } from "../../types/media";
import "./EpisodeCard.css";
import stockImage from "../../assets/images/stock-image.jpg";

interface EpisodeCardProps {
  episode: Episode;
  showId: number;
  seasonNumber: number;
  poster?: string;
  state?: any;
}

export default function EpisodeCard({
  episode,
  showId,
  seasonNumber,
  poster,
  state,
}: EpisodeCardProps) {
  // Use episode thumbnail if available, or show poster, or fallback to stockImage
  const imageSrc = episode.thumbnail || poster || stockImage;

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
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (poster && img.src !== poster) {
              img.src = poster;
            } else if (img.src !== stockImage) {
              img.src = stockImage;
            }
          }}
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
