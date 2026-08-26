import { useShows } from "../../contexts/ShowContext";
import ShowCard from "../../components/ShowCard/ShowCard";
import "./Dashboard.css";

export default function Home() {
  const { shows, loading, error } = useShows();

  if (loading) {
    return (
      <div className="home-page">
        {/* Skeleton Hero */}
        <div className="hero hero-skeleton">
          <div className="hero-content-skeleton">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-meta"></div>
            <div className="skeleton-line skeleton-desc"></div>
          </div>
        </div>

        {/* Skeleton Section */}
        <section className="home-section">
          <h2>Popular Shows</h2>
          <div className="shows-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="show-card show-card-skeleton">
                <div className="show-card-image-skeleton"></div>
                <div className="show-card-info-skeleton">
                  <div className="skeleton-line skeleton-card-title"></div>
                  <div className="skeleton-line skeleton-card-meta"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Connection Issue</h2>
          <p>{error}</p>
          <p className="error-tip">Please check if your backend API service is running locally.</p>
        </div>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="home-page">
        <div style={{ padding: "80px 60px", textAlign: "center" }}>
          <h2>No Shows Available</h2>
          <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>
            Add some series in the Library tab to get started.
          </p>
        </div>
      </div>
    );
  }

  const featuredShow = shows[0];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          backgroundImage: `url(${featuredShow.backdrop})`,
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content">
            <p className="hero-label">Featured Series</p>
            <h1 className="hero-title">{featuredShow.title}</h1>
            <div className="hero-meta">
              <span>{featuredShow.releaseYear}</span>
              <span>{featuredShow.seasons.length} Seasons</span>
            </div>
            <p className="hero-description">{featuredShow.description}</p>
          </div>
        </div>
      </section>

      {/* Popular Shows Section */}
      <section className="home-section">
        <h2>Popular Shows</h2>
        <div className="shows-grid">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </section>
    </div>
  );
}