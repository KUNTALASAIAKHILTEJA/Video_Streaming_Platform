import type { Show, Season, Episode, Genre } from "../types/media";
import type { AuditLogEntry } from "../contexts/ShowContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper for standard JSON responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  return response.json() as Promise<T>;
}

export const Api = {
  // Show APIs
  async fetchShows(): Promise<Show[]> {
    const response = await fetch(`${API_BASE_URL}/shows`);
    return handleResponse<Show[]>(response);
  },

  async createShow(showData: Omit<Show, "id" | "seasons">): Promise<Show> {
    const response = await fetch(`${API_BASE_URL}/shows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showData),
    });
    return handleResponse<Show>(response);
  },

  async updateShow(showId: number, showData: Partial<Omit<Show, "id" | "seasons">>): Promise<Show> {
    const response = await fetch(`${API_BASE_URL}/shows/${showId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showData),
    });
    return handleResponse<Show>(response);
  },

  async deleteShow(showId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/shows/${showId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Season APIs
  async addSeason(showId: number): Promise<Season> {
    const response = await fetch(`${API_BASE_URL}/shows/${showId}/seasons`, {
      method: "POST",
    });
    return handleResponse<Season>(response);
  },

  async deleteSeason(showId: number, seasonNumber: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/shows/${showId}/seasons/${seasonNumber}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Episode APIs
  async addEpisode(showId: number, seasonNumber: number, episodeData: Omit<Episode, "id">): Promise<Episode> {
    const response = await fetch(`${API_BASE_URL}/shows/${showId}/seasons/${seasonNumber}/episodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(episodeData),
    });
    return handleResponse<Episode>(response);
  },

  async updateEpisode(
    showId: number,
    seasonNumber: number,
    episodeId: number,
    episodeData: Partial<Omit<Episode, "id">>
  ): Promise<Episode> {
    const response = await fetch(
      `${API_BASE_URL}/shows/${showId}/seasons/${seasonNumber}/episodes/${episodeId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(episodeData),
      }
    );
    return handleResponse<Episode>(response);
  },

  async deleteEpisode(showId: number, seasonNumber: number, episodeId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/shows/${showId}/seasons/${seasonNumber}/episodes/${episodeId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Audit Log APIs
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`);
    return handleResponse<AuditLogEntry[]>(response);
  },

  async createAuditLog(action: "create" | "update" | "delete", details: string): Promise<AuditLogEntry> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, details }),
    });
    return handleResponse<AuditLogEntry>(response);
  },

  async clearAuditLogs(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Genre APIs
  async fetchGenres(): Promise<Genre[]> {
    const response = await fetch(`${API_BASE_URL}/genre/`);
    return handleResponse<Genre[]>(response);
  },

  async createGenre(genreData: Omit<Genre, "id">): Promise<Genre> {
    const response = await fetch(`${API_BASE_URL}/genre/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(genreData),
    });
    return handleResponse<Genre>(response);
  },

  async deleteGenre(genreId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/genre/${genreId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  async login(username: string, password: string): Promise<{ token: string; user: { username: string; role: string } }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ token: string; user: { username: string; role: string } }>(response);
  }
};
