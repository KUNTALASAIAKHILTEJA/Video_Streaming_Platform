import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Show, Episode, Genre } from "../types/media";
import { Api } from "../Services/Api";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: "create" | "update" | "delete";
  details: string;
}

interface ShowContextType {
  shows: Show[];
  auditLogs: AuditLogEntry[];
  genres: Genre[];
  loading: boolean;
  error: string | null;
  addShow: (show: Omit<Show, "id" | "seasons">) => Promise<void>;
  updateShow: (showId: number, updatedFields: Partial<Omit<Show, "id" | "seasons">>) => Promise<void>;
  deleteShow: (showId: number) => Promise<void>;
  addSeason: (showId: number) => Promise<void>;
  deleteSeason: (showId: number, seasonNumber: number) => Promise<void>;
  addEpisode: (showId: number, seasonNumber: number, episode: Omit<Episode, "id">) => Promise<void>;
  updateEpisode: (showId: number, seasonNumber: number, episodeId: number, updatedEpisode: Partial<Omit<Episode, "id">>) => Promise<void>;
  deleteEpisode: (showId: number, seasonNumber: number, episodeId: number) => Promise<void>;
  clearAuditLogs: () => Promise<void>;
  createGenre: (genre: Omit<Genre, "id">) => Promise<void>;
}

const ShowContext = createContext<ShowContextType | undefined>(undefined);

export function ShowProvider({ children }: { children: ReactNode }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data from the API
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError(null);
        const [fetchedShows, fetchedLogs, fetchedGenres] = await Promise.all([
          Api.fetchShows().catch((err) => {
            console.error("Failed to fetch shows from API, falling back to empty list", err);
            return [];
          }),
          Api.fetchAuditLogs().catch((err) => {
            console.error("Failed to fetch audit logs from API, falling back to empty list", err);
            return [];
          }),
          Api.fetchGenres().catch((err) => {
            console.error("Failed to fetch genres from API, falling back to empty list", err);
            return [];
          }),
        ]);
        setShows(fetchedShows);
        setAuditLogs(fetchedLogs);
        setGenres(fetchedGenres);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading data.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const addShow = async (newShowData: Omit<Show, "id" | "seasons">) => {
    try {
      setError(null);
      const newShow = await Api.createShow(newShowData);
      setShows((prev) => [...prev, newShow]);

      const details = `Added new series "${newShow.title}"`;
      const newLog = await Api.createAuditLog("create", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add show");
      throw err;
    }
  };

  const updateShow = async (showId: number, updatedFields: Partial<Omit<Show, "id" | "seasons">>) => {
    try {
      setError(null);
      const updatedShow = await Api.updateShow(showId, updatedFields);
      setShows((prev) =>
        prev.map((s) => (s.id === showId ? { ...s, ...updatedShow } : s))
      );

      const details = `Updated series "${updatedShow.title}" fields`;
      const newLog = await Api.createAuditLog("update", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update show");
      throw err;
    }
  };

  const deleteShow = async (showId: number) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      await Api.deleteShow(showId);
      setShows((prev) => prev.filter((s) => s.id !== showId));

      const details = `Deleted series "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("delete", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete show");
      throw err;
    }
  };

  const addSeason = async (showId: number) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      const newSeason = await Api.addSeason(showId);
      setShows((prev) =>
        prev.map((s) => {
          if (s.id === showId) {
            return {
              ...s,
              seasons: [...s.seasons, newSeason],
            };
          }
          return s;
        })
      );

      const details = `Added Season ${newSeason.seasonNumber} to series "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("create", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add season");
      throw err;
    }
  };

  const deleteSeason = async (showId: number, seasonNumber: number) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      await Api.deleteSeason(showId, seasonNumber);
      setShows((prev) =>
        prev.map((s) => {
          if (s.id === showId) {
            return {
              ...s,
              seasons: s.seasons.filter((se) => se.seasonNumber !== seasonNumber),
            };
          }
          return s;
        })
      );

      const details = `Deleted Season ${seasonNumber} from series "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("delete", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete season");
      throw err;
    }
  };

  const addEpisode = async (showId: number, seasonNumber: number, epData: Omit<Episode, "id">) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      const newEpisode = await Api.addEpisode(showId, seasonNumber, epData);
      setShows((prev) =>
        prev.map((s) => {
          if (s.id === showId) {
            return {
              ...s,
              seasons: s.seasons.map((se) => {
                if (se.seasonNumber === seasonNumber) {
                  return {
                    ...se,
                    episodes: [...se.episodes, newEpisode],
                  };
                }
                return se;
              }),
            };
          }
          return s;
        })
      );

      const details = `Added Episode ${epData.episodeNumber} ("${epData.title}") to Season ${seasonNumber} of "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("create", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add episode");
      throw err;
    }
  };

  const updateEpisode = async (
    showId: number,
    seasonNumber: number,
    episodeId: number,
    updatedFields: Partial<Omit<Episode, "id">>
  ) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      const updatedEpisode = await Api.updateEpisode(showId, seasonNumber, episodeId, updatedFields);
      setShows((prev) =>
        prev.map((s) => {
          if (s.id === showId) {
            return {
              ...s,
              seasons: s.seasons.map((se) => {
                if (se.seasonNumber === seasonNumber) {
                  return {
                    ...se,
                    episodes: se.episodes.map((e) => (e.id === episodeId ? updatedEpisode : e)),
                  };
                }
                return se;
              }),
            };
          }
          return s;
        })
      );

      const details = `Updated Episode ${updatedEpisode.episodeNumber} ("${updatedEpisode.title}") in Season ${seasonNumber} of "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("update", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update episode");
      throw err;
    }
  };

  const deleteEpisode = async (showId: number, seasonNumber: number, episodeId: number) => {
    try {
      setError(null);
      const targetShow = shows.find((s) => s.id === showId);
      if (!targetShow) return;

      const targetSeason = targetShow.seasons.find((se) => se.seasonNumber === seasonNumber);
      const targetEpisode = targetSeason?.episodes.find((e) => e.id === episodeId);
      if (!targetEpisode) return;

      await Api.deleteEpisode(showId, seasonNumber, episodeId);
      setShows((prev) =>
        prev.map((s) => {
          if (s.id === showId) {
            return {
              ...s,
              seasons: s.seasons.map((se) => {
                if (se.seasonNumber === seasonNumber) {
                  return {
                    ...se,
                    episodes: se.episodes.filter((e) => e.id !== episodeId),
                  };
                }
                return se;
              }),
            };
          }
          return s;
        })
      );

      const details = `Deleted Episode ${targetEpisode.episodeNumber} ("${targetEpisode.title}") from Season ${seasonNumber} of "${targetShow.title}"`;
      const newLog = await Api.createAuditLog("delete", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete episode");
      throw err;
    }
  };

  const clearAuditLogs = async () => {
    try {
      setError(null);
      await Api.clearAuditLogs();
      setAuditLogs([]);

      const details = "Cleared all audit logs";
      const newLog = await Api.createAuditLog("delete", details);
      setAuditLogs([newLog]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to clear audit logs");
      throw err;
    }
  };

  const createGenre = async (genreData: Omit<Genre, "id">) => {
    try {
      setError(null);
      const newGenre = await Api.createGenre(genreData);
      setGenres((prev) => [...prev, newGenre]);

      const details = `Created new genre "${newGenre.name}"`;
      const newLog = await Api.createAuditLog("create", details);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create genre");
      throw err;
    }
  };

  return (
    <ShowContext.Provider
      value={{
        shows,
        auditLogs,
        genres,
        loading,
        error,
        addShow,
        updateShow,
        deleteShow,
        addSeason,
        deleteSeason,
        addEpisode,
        updateEpisode,
        deleteEpisode,
        clearAuditLogs,
        createGenre,
      }}
    >
      {children}
    </ShowContext.Provider>
  );
}

export function useShows() {
  const context = useContext(ShowContext);
  if (!context) {
    throw new Error("useShows must be used within a ShowProvider");
  }
  return context;
}
