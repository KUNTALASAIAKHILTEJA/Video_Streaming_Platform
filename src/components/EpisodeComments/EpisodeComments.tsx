import React, { useState, useEffect, useCallback } from "react";
import { Api } from "../../Services/Api";
import { useAuth } from "../../contexts/AuthContext";
import type { Comment } from "../../types/media";
import "./EpisodeComments.css";

interface EpisodeCommentsProps {
  episodeId: number;
  seriesId?: number;
  episodeTitle?: string;
}

export default function EpisodeComments({ episodeId, seriesId, episodeTitle }: EpisodeCommentsProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await Api.fetchComments({ episodeId });
      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setComments(sorted);
    } catch (err: any) {
      console.error("Failed to load comments:", err);
      setError(err.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [episodeId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentText.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      setError(null);
      const created = await Api.createComment({
        episode: episodeId,
        series: seriesId,
        text,
      });
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setError(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleSaveEdit = async (commentId: number) => {
    const text = editText.trim();
    if (!text) return;

    try {
      setActionLoadingId(commentId);
      const updated = await Api.updateComment(commentId, text);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, text: updated.text, updated_at: updated.updated_at } : c))
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (err: any) {
      console.error("Failed to update comment:", err);
      alert(err.message || "Failed to update comment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      setActionLoadingId(commentId);
      await Api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      alert(err.message || "Failed to delete comment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffSec < 60) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return isoString;
    }
  };

  const getAvatarLetter = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <div className="comments-header-title">
          <span className="comments-icon">💬</span>
          <h3>Episode Discussion</h3>
          <span className="comments-count-pill">{comments.length}</span>
        </div>
        <button
          type="button"
          onClick={loadComments}
          className="comments-refresh-btn"
          title="Refresh comments"
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="comments-error-banner">
          <span>{error}</span>
          <button onClick={loadComments} className="comments-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* New Comment Input Box */}
      <form onSubmit={handleSubmit} className="new-comment-form">
        <div className="comment-avatar user-avatar">
          {getAvatarLetter(user?.username)}
        </div>
        <div className="new-comment-input-wrap">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={`Comment on ${episodeTitle ? `"${episodeTitle}"` : "this episode"}...`}
            rows={2}
            className="new-comment-textarea"
            maxLength={1000}
            disabled={submitting}
          />
          <div className="new-comment-actions">
            <span className="comment-char-count">
              {newCommentText.length}/1000
            </span>
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="comment-submit-btn"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {loading && comments.length === 0 ? (
          <div className="comments-loading">
            <div className="comments-spinner" />
            <p>Loading episode comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty-state">
            <div className="empty-icon">💭</div>
            <h4>No comments yet</h4>
            <p>Be the first to share your thoughts on this episode!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = user && (user.id === comment.user || user.username === comment.user_username);
            const canManage = isOwner || isAdmin;
            const isEditing = editingCommentId === comment.id;
            const isProcessing = actionLoadingId === comment.id;

            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {getAvatarLetter(comment.user_username)}
                </div>

                <div className="comment-body">
                  <div className="comment-meta">
                    <div className="comment-user-info">
                      <span className="comment-username">{comment.user_username || "Viewer"}</span>
                      {isOwner && <span className="comment-badge owner-badge">You</span>}
                      {isAdmin && isOwner && <span className="comment-badge admin-badge">Admin</span>}
                    </div>
                    <div className="comment-meta-right">
                      <span className="comment-timestamp" title={comment.created_at}>
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                        <span className="comment-edited-tag">(edited)</span>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="comment-edit-box">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="comment-edit-textarea"
                        rows={3}
                        maxLength={1000}
                        autoFocus
                      />
                      <div className="comment-edit-actions">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="comment-btn-secondary"
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="comment-btn-primary"
                          disabled={isProcessing || !editText.trim()}
                        >
                          {isProcessing ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="comment-text">{comment.text}</p>
                  )}

                  {!isEditing && canManage && (
                    <div className="comment-actions-bar">
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(comment)}
                          className="comment-action-link"
                          disabled={isProcessing}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="comment-action-link delete-link"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
