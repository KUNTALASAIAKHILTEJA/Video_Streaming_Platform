export interface Episode {
  id: number;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
}

export interface Season {
  id: number;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Show {
  id: number;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  genre: string[];
  rating: number;
  releaseYear: number;
  seasons: Season[];
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  description: string;
}