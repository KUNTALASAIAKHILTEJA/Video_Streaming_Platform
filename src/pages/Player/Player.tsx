import { useParams, Link, useLocation } from "react-router-dom";
import { useShows } from "../../contexts/ShowContext";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import EpisodeCard from "../../components/EpisodeCard/EpisodeCard";
import "./Player.css";

export default function Player() {
  const { showId, seasonId, episodeId } = useParams<{
    showId: string;
    seasonId: string;
    episodeId: string;
  }>();

  const { shows } = useShows();
  const location = useLocation();
  const show = shows.find((s) => s.id === Number(showId));
  const season = show?.seasons.find((s) => s.seasonNumber === Number(seasonId));
  const episode = season?.episodes.find((e) => e.episodeNumber === Number(episodeId));

  const backTo = location.state?.from || "/";

  if (!show || !season || !episode) {
    return (
      <div className="player-page-error">
        <h2>Episode not found</h2>
        <Link to={backTo} className="back-link">
          {backTo === "/series" ? "Back to Series" : "Back to Dashboard"}
        </Link>
      </div>
    );
  }

  // 
  let nextEpisodes = season.episodes.filter(
    (e) => e.episodeNumber > episode.episodeNumber
  );    

  // if at the end of the season,
  let nextSeasonNumber = season.seasonNumber;
  if (nextEpisodes.length === 0 && show.seasons) {
    const nextSeason = show.seasons.find(
      (s) => s.seasonNumber === season.seasonNumber + 1
    );
    if (nextSeason) {
      nextEpisodes = nextSeason.episodes;
      nextSeasonNumber = nextSeason.seasonNumber;
    }
  }

  return (
    <div className="player-page">
      <Link to={`/show/${show.id}`} state={{ from: backTo }} className="back-to-show-btn">
        ← Back to {show.title}
      </Link>

      <div className="player-wrapper">
        <VideoPlayer videoUrl={episode.videoUrl} />
      </div>

      <div className="player-details-section">
        <div className="player-details-header">
          <p className="episode-indicator">
            Season {season.seasonNumber} • Episode {episode.episodeNumber}
          </p>
          <h1 className="player-episode-title">{episode.title}</h1>
          <p className="player-duration">{episode.duration}</p>
        </div>
      </div>

      {nextEpisodes.length > 0 && (
        <div className="next-episodes-section">
          <h2>Next Episodes</h2>
          <div className="next-episodes-scroll-container">
            {nextEpisodes.map((nextEp) => (
              <EpisodeCard
                key={nextEp.id}
                episode={nextEp}
                showId={show.id}
                seasonNumber={nextSeasonNumber}
                poster={show.poster}
                state={{ from: backTo }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}