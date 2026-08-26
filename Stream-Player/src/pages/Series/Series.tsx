import { useState } from "react";
import ShowCard from "../../components/ShowCard/ShowCard";
import { useShows } from "../../contexts/ShowContext";
import type { Show } from "../../types/media";
import ShowModal from "../../components/ShowModal/ShowModal";
import "./Series.css";

export default function Series() {
  const { shows, loading, error, deleteShow } = useShows();

  // Modals visibility state
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showModalMode, setShowModalMode] = useState<"add" | "edit">("add");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  // Modal open triggers
  const handleOpenAddShow = () => {
    setShowModalMode("add");
    setSelectedShow(null);
    setShowModalOpen(true);
  };

  const handleOpenEditShow = (show: Show) => {
    setShowModalMode("edit");
    setSelectedShow(show);
    setShowModalOpen(true);
  };

  const handleDeleteShow = (showId: number, showTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${showTitle}"?`)) {
      deleteShow(showId);
    }
  };

  if (loading) {
    return (
      <div className="series-page">
        <section className="home-section">
          <div className="section-header">
            <h2>Library</h2>
            <button className="add-series-btn" disabled>
              + Add Series
            </button>
          </div>
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
      <div className="series-page">
        <section className="home-section">
          <div className="section-header">
            <h2>Library</h2>
          </div>
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Library Connection Issue</h2>
            <p>{error}</p>
            <p className="error-tip">Please check if your backend API service is running locally.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="series-page">
      <section className="home-section">
        <div className="section-header">
          <h2>Library</h2>
          <button className="add-series-btn" onClick={handleOpenAddShow}>
            + Add Series
          </button>
        </div>

        {shows.length === 0 ? (
          <div className="empty-library">
            <p>Your library is empty. Click "+ Add Series" to start building your streaming catalogue!</p>
          </div>
        ) : (
          <div className="shows-grid">
            {shows.map((show) => (
              <div className="show-card-wrapper" key={show.id}>
                <ShowCard show={show} />
                <div className="show-card-actions-overlay">
                  <button className="action-btn edit-btn" onClick={() => handleOpenEditShow(show)}>
                    ✏️ Edit
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteShow(show.id, show.title)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reusable Show and Seasons Modal component */}
      <ShowModal
        isOpen={showModalOpen}
        onClose={() => setShowModalOpen(false)}
        mode={showModalMode}
        show={selectedShow}
      />
    </div>
  );
} 