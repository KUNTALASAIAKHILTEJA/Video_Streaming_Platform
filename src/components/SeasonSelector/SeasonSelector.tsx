import type { Season } from "../../types/media";
import "./SeasonSelector.css";

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonNumber: number;
  onSelectSeason: (seasonNumber: number) => void;
}

export default function SeasonSelector({
  seasons,
  selectedSeasonNumber,
  onSelectSeason,
}: SeasonSelectorProps) {
  return (
    <div className="season-selector-container">
      {/* <label htmlFor="season-select" className="season-selector-label">
      </label> */}
      <div className="season-select-wrapper">
        <select
          id="season-select"
          className="season-select"
          value={selectedSeasonNumber}
          onChange={(e) => onSelectSeason(Number(e.target.value))}
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.seasonNumber}>
              Season {season.seasonNumber}
            </option>
          ))}
        </select>
        <p className="season-select-arrow">▼</p>
      </div>
    </div>
  );
}
