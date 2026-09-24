import type { Show, Season, Episode, Genre } from "../types/media";
import type { AuditLogEntry } from "../contexts/ShowContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Auth-only headers – DO NOT set Content-Type for FormData (browser adds boundary automatically)
function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("stream_player_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// JSON headers for requests that do not contain files
function getJsonHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("stream_player_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Generic response handler – handles 204 No Content gracefully
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  return response.json() as Promise<T>;
}

// Fetch ALL pages from a DRF paginated list endpoint.
// Handles both paginated { results: [...] } and plain array responses.
async function fetchAllPages<T>(url: string, headers: HeadersInit): Promise<T[]> {
  const allItems: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();

    // DRF paginated response has a "results" array
    if (data && typeof data === "object" && Array.isArray(data.results)) {
      allItems.push(...data.results);
      // Convert absolute next URL to work through Vite proxy if needed
      if (data.next) {
        // If next is absolute (http://localhost:8000/api/...), rewrite to relative /api/...
        try {
          const parsed = new URL(data.next);
          nextUrl = parsed.pathname + parsed.search;
        } catch {
          nextUrl = data.next;
        }
      } else {
        nextUrl = null;
      }
    } else if (Array.isArray(data)) {
      // Plain array (no pagination)
      allItems.push(...data);
      nextUrl = null;
    } else {
      // Unexpected shape — return empty
      console.warn("Unexpected response shape from", url, data);
      nextUrl = null;
    }
  }
  return allItems;
}

// Build absolute media URL from a relative backend path
function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  return `http://localhost:8000${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── DRF model types ──────────────────────────────────────────────────────────

interface DRFGenre {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface DRFSeries {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  banner: string | null;
  status: string;
  rating: string;
  age_rating: string;
  language: string[];
  country: string;
  genres: DRFGenre[];
  created_at: string;
  updated_at: string;
}

interface DRFSeason {
  id: number;
  series: number;
  season_number: number;
  title: string;
  description: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

interface DRFEpisode {
  id: number;
  season: number;
  episode_number: number;
  title: string;
  description: string;
  thumbnail: string | null;
  video_file: string | null;
  genres: DRFGenre[];
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface DRFWatchHistory {
  id: number;
  user: number;
  episode: number;
  progress_seconds: number;
  completed: boolean;
  last_watched_at: string;
  created_at: string;
  updated_at: string;
}

export interface DRFAuditLog {
  id: number;
  action: "create" | "update" | "delete";
  details: string;
  timestamp: string;
}



// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapDRFSeries(series: DRFSeries, showSeasons: Season[]): Show {
  return {
    id: series.id,
    title: series.title,
    description: series.description,
    poster: resolveMediaUrl(series.thumbnail),
    backdrop: resolveMediaUrl(series.banner),
    genre: series.genres ? series.genres.map((g) => g.name) : [],
    rating: Number(series.rating) || 0,
    releaseYear: series.created_at ? new Date(series.created_at).getFullYear() : new Date().getFullYear(),
    seasons: showSeasons,
  };
}

function mapDRFEpisode(e: DRFEpisode): Episode {
  return {
    id: e.id,
    episodeNumber: e.episode_number,
    title: e.title,
    description: e.description,
    thumbnail: resolveMediaUrl(e.thumbnail),
    duration: e.duration || 0,
    videoUrl: resolveMediaUrl(e.video_file),
  };
}

// ─── API object ───────────────────────────────────────────────────────────────

export const Api = {

  // Show APIs
  async fetchShows(): Promise<Show[]> {
    const headers = getAuthHeaders();
    const [drfSeries, drfSeasons, drfEpisodes] = await Promise.all([
      fetchAllPages<DRFSeries>(`${API_BASE_URL}/series/`, headers),
      fetchAllPages<DRFSeason>(`${API_BASE_URL}/seasons/`, headers),
      fetchAllPages<DRFEpisode>(`${API_BASE_URL}/episodes/`, headers),
    ]);

    return drfSeries.map((series) => {
      const showSeasons: Season[] = drfSeasons
        .filter((s) => s.series === series.id)
        .map((s) => ({
          id: s.id,
          seasonNumber: s.season_number,
          episodes: drfEpisodes
            .filter((e) => e.season === s.id)
            .map(mapDRFEpisode)
            .sort((a, b) => a.episodeNumber - b.episodeNumber),
        }))
        .sort((a, b) => a.seasonNumber - b.seasonNumber);
      return mapDRFSeries(series, showSeasons);
    });
  },

  async createShow(
    showData: Omit<Show, "id" | "seasons">,
    posterFile?: File,
    backdropFile?: File
  ): Promise<Show> {
    const genres = await this.fetchGenres();
    const genreIds = showData.genre
      .map((name) => genres.find((g) => g.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is number => id !== undefined);

    const formData = new FormData();
    formData.append("title", showData.title);
    formData.append("slug", showData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    formData.append("description", showData.description);
    formData.append("status", "ongoing");
    formData.append("rating", String(showData.rating));
    formData.append("age_rating", "13+");
    formData.append("country", "INDIA");
    genreIds.forEach((id) => formData.append("genre_ids", String(id)));
    if (posterFile) formData.append("thumbnail", posterFile);
    if (backdropFile) formData.append("banner", backdropFile);

    const response = await fetch(`${API_BASE_URL}/series/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const created = await handleResponse<DRFSeries>(response);
    return mapDRFSeries(created, []);
  },

  async updateShow(
    showId: number,
    showData: Partial<Omit<Show, "id" | "seasons">>,
    posterFile?: File,
    backdropFile?: File
  ): Promise<Show> {
    const formData = new FormData();
    if (showData.title !== undefined) {
      formData.append("title", showData.title);
      formData.append("slug", showData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
    if (showData.description !== undefined) formData.append("description", showData.description);
    if (showData.rating !== undefined) formData.append("rating", String(showData.rating));

    if (showData.genre !== undefined) {
      const genres = await this.fetchGenres();
      const genreIds = showData.genre
        .map((name) => genres.find((g) => g.name.toLowerCase() === name.toLowerCase())?.id)
        .filter((id): id is number => id !== undefined);
      genreIds.forEach((id) => formData.append("genre_ids", String(id)));
    }

    if (posterFile) formData.append("thumbnail", posterFile);
    if (backdropFile) formData.append("banner", backdropFile);

    const response = await fetch(`${API_BASE_URL}/series/${showId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: formData,
    });
    const updated = await handleResponse<DRFSeries>(response);
    return mapDRFSeries(updated, []);
  },

  async deleteShow(showId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/series/${showId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Season APIs
  async addSeason(showId: number): Promise<Season> {
    const allSeasons = await fetchAllPages<DRFSeason>(`${API_BASE_URL}/seasons/`, getAuthHeaders());
    const seriesSeasons = allSeasons.filter((s) => s.series === showId);
    const nextSeasonNum =
      seriesSeasons.length > 0 ? Math.max(...seriesSeasons.map((s) => s.season_number)) + 1 : 1;

    const response = await fetch(`${API_BASE_URL}/seasons/`, {
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        series: showId,
        season_number: nextSeasonNum,
        title: `Season ${nextSeasonNum}`,
        description: `Season ${nextSeasonNum} of series`,
      }),
    });
    const created = await handleResponse<DRFSeason>(response);
    return { id: created.id, seasonNumber: created.season_number, episodes: [] };
  },

  async deleteSeason(showId: number, seasonNumber: number): Promise<void> {
    const allSeasons = await fetchAllPages<DRFSeason>(`${API_BASE_URL}/seasons/`, getAuthHeaders());
    const targetSeason = allSeasons.find((s) => s.series === showId && s.season_number === seasonNumber);
    if (!targetSeason) throw new Error("Season not found");

    const response = await fetch(`${API_BASE_URL}/seasons/${targetSeason.id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Episode APIs
  async addEpisode(
    showId: number,
    seasonNumber: number,
    episodeData: Omit<Episode, "id">,
    videoFile?: File,
    thumbnailFile?: File
  ): Promise<Episode> {
    const allSeasons = await fetchAllPages<DRFSeason>(`${API_BASE_URL}/seasons/`, getAuthHeaders());
    const targetSeason = allSeasons.find((s) => s.series === showId && s.season_number === seasonNumber);
    if (!targetSeason) throw new Error("Season not found");

    const formData = new FormData();
    formData.append("season", String(targetSeason.id));
    formData.append("episode_number", String(episodeData.episodeNumber));
    formData.append("title", episodeData.title);
    formData.append("description", episodeData.description);
    formData.append("duration", String(episodeData.duration));
    if (videoFile) formData.append("video_file", videoFile);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    const response = await fetch(`${API_BASE_URL}/episodes/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    const created = await handleResponse<DRFEpisode>(response);
    return mapDRFEpisode(created);
  },

  async updateEpisode(
    _showId: number,
    _seasonNumber: number,
    episodeId: number,
    episodeData: Partial<Omit<Episode, "id">>,
    videoFile?: File,
    thumbnailFile?: File
  ): Promise<Episode> {
    const formData = new FormData();
    if (episodeData.episodeNumber !== undefined) formData.append("episode_number", String(episodeData.episodeNumber));
    if (episodeData.title !== undefined) formData.append("title", episodeData.title);
    if (episodeData.description !== undefined) formData.append("description", episodeData.description);
    if (episodeData.duration !== undefined) formData.append("duration", String(episodeData.duration));
    if (videoFile) formData.append("video_file", videoFile);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: formData,
    });
    const updated = await handleResponse<DRFEpisode>(response);
    return mapDRFEpisode(updated);
  },

  async deleteEpisode(_showId: number, _seasonNumber: number, episodeId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Audit Log APIs
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    const logs = await fetchAllPages<DRFAuditLog>(`${API_BASE_URL}/auditlog/`, getAuthHeaders());
    return logs.map((log) => ({
      id: String(log.id),
      timestamp: log.timestamp,
      action: ((log.action || "create").toLowerCase()) as "create" | "update" | "delete",
      details: log.details || "",
    }));
  },

  async createAuditLog(action: "create" | "update" | "delete", details: string): Promise<AuditLogEntry> {
    try {
      const response = await fetch(`${API_BASE_URL}/auditlog/`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          action: action.toUpperCase(),
          details,
          model_name: "Catalog",
        }),
      });
      if (response.ok) {
        const created = await response.json();
        return {
          id: String(created.id),
          timestamp: created.timestamp || new Date().toISOString(),
          action: (created.action ? created.action.toLowerCase() : action) as "create" | "update" | "delete",
          details: created.details || details,
        };
      }
    } catch {
      // Fall back gracefully
    }
    return {
      id: String(Date.now()),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
  },

  async clearAuditLogs(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auditlog/clear/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        console.warn("Audit logs clear endpoint returned:", response.status);
      }
    } catch (e) {
      console.warn("Failed to clear audit logs on backend:", e);
    }
  },


  // Genre APIs
  async fetchGenres(): Promise<Genre[]> {
    return fetchAllPages<Genre>(`${API_BASE_URL}/genre/`, getAuthHeaders());
  },

  async createGenre(genreData: Omit<Genre, "id">): Promise<Genre> {
    const response = await fetch(`${API_BASE_URL}/genre/`, {
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify(genreData),
    });
    return handleResponse<Genre>(response);
  },

  async deleteGenre(genreId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/genre/${genreId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok && response.status !== 204) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  },

  // Authentication – authenticate via JWT /api/token/ and fetch user profile
  async login(
    username: string,
    password: string
  ): Promise<{ token: string; refreshToken?: string; user: { id: number; username: string; email: string; is_staff: boolean; is_superuser: boolean; role: "admin" | "user" } }> {
    // 1. Obtain JWT token pair from /api/token/
    const tokenResponse = await fetch(`${API_BASE_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.detail || "Invalid username or password.");
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access;
    const refreshToken = tokenData.refresh;

    localStorage.setItem("stream_player_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("stream_player_refresh_token", refreshToken);
    }

    // 2. Fetch authenticated user profile using Bearer access token
    const profileResponse = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) {
      throw new Error("Failed to load user profile.");
    }
    const user = await profileResponse.json();
    return {
      token: accessToken,
      refreshToken,
      user,
    };
  },

  async refreshToken(): Promise<string | null> {
    const refresh = localStorage.getItem("stream_player_refresh_token");
    if (!refresh) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.access) {
        localStorage.setItem("stream_player_token", data.access);
        return data.access;
      }
    } catch {
      // Ignore network errors
    }
    return null;
  },

  async fetchCurrentUser(): Promise<{ id: number; username: string; email: string; is_staff: boolean; is_superuser: boolean; role: "admin" | "user" }> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
