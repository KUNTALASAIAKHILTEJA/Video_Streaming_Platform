import { useState } from "react";
import { Link } from "react-router-dom";
import { useShows } from "../../contexts/ShowContext";
import { useAuth } from "../../contexts/AuthContext";
import type { Show } from "../../types/media";
import ShowModal from "../../components/ShowModal/ShowModal";
import stockImage from "../../assets/images/stock-image.jpg";
import "./Series.css";

export default function Series() {
  const { shows, loading, error, deleteShow } = useShows();
  const { isAdmin } = useAuth();

  // Modals visibility state
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showModalMode, setShowModalMode] = useState<"add" | "edit">("add");
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  // Inline delete confirmation – holds the id of the show pending deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Modal open triggers
  const handleOpenAddShow = () => {
    setShowModalMode("add");
    setSelectedShow(null);
    setShowModalOpen(true);
  };

  const handleOpenEditShow = (e: React.MouseEvent, show: Show) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModalMode("edit");
    setSelectedShow(show);
    setShowModalOpen(true);
  };

  const handleDeleteShow = (e: React.MouseEvent, showId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    setConfirmDeleteId(showId);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, showId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    try {
      await deleteShow(showId);
    } catch (err: any) {
      alert(`Delete failed: ${err.message || "Unknown error"}`);
    }
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <div className="series-page">
        <section className="home-section">
          <div className="section-header">
            <h2>Library</h2>
            {isAdmin && (
              <button className="add-series-btn" disabled>
                + Add Series
              </button>
            )}
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
          {isAdmin && (
            <button className="add-series-btn" onClick={handleOpenAddShow}>
              + Add Series
            </button>
          )}
        </div>

        {shows.length === 0 ? (
          <div className="empty-library">
            <p>
              {isAdmin
                ? "Your library is empty. Click '+ Add Series' to start building your streaming catalogue!"
                : "No series currently available in the catalogue."}
            </p>
          </div>
        ) : (
          <div className="shows-grid">
            {shows.map((show) => (
              <div className="show-card-wrapper" key={show.id}>
                {/* Card link area – navigates to episode grid */}
                <Link to={`/show/${show.id}`} state={{ from: "/series" }} className="show-card">
                  <div className="show-card-image-wrapper">
                    <img
                      src={show.poster || stockImage}
                      alt={show.title}
                      className="show-card-image"
                      onError={(e) => { (e.target as HTMLImageElement).src = stockImage; }}
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

                {/* Action row – rendered ONLY for admins */}
                {isAdmin && (
                  <div className="show-card-actions">
                    {confirmDeleteId === show.id ? (
                      // Inline confirmation
                      <>
                        <span className="delete-confirm-label">Delete?</span>
                        <button
                          className="action-btn confirm-delete-btn"
                          onClick={(e) => handleConfirmDelete(e, show.id)}
                        >
                          Yes, Delete
                        </button>
                        <button
                          className="action-btn cancel-btn"
                          onClick={handleCancelDelete}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      // Normal state
                      <>
                        <button
                          className="action-btn edit-btn"
                          onClick={(e) => handleOpenEditShow(e, show)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => handleDeleteShow(e, show.id)}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
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
