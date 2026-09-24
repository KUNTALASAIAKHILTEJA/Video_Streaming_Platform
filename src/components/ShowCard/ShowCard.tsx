import { Link, useLocation } from "react-router-dom";
import type { Show } from "../../types/media";
import "./ShowCard.css";
import stockImage from "../../assets/images/stock-image.jpg";

interface ShowCardProps {
  show: Show;
}

export default function ShowCard({ show }: ShowCardProps) {
  const location = useLocation();
  // Use specific show poster as thumbnail, fallback to stockImage if missing or fails to load
  const imageSrc = show.poster || stockImage;

  return (
    <Link 
      to={`/show/${show.id}`} 
      state={{ from: location.pathname }}
      className="show-card"
    >
      <div className="show-card-image-wrapper">
        <img 
          src={imageSrc} 
          alt={show.title} 
          className="show-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = stockImage;
          }}
        />
      </div>
      <div className="show-card-info">
        <h3 className="show-card-title">{show.title}</h3>
        <div className="show-card-meta">
          <span className="show-card-year">{show.releaseYear}</span>
          <span className="show-card-genres">{show.genre.slice(0, 2).join(" • ")}</span>
        </div>
      </div>
    </Link>
  );
}