/**
 * Toxic AniStream — Dual-Source API Service
 *
 * Primary  : Self-hosted HiAnime scraper (VITE_API_URL)
 * Fallback : GogoAnime via self-hosted Consumet (VITE_CONSUMET_URL)
 *
 * All responses are normalised to the HiAnime shape so the rest
 * of the app works without any changes.
 */

import axios from "axios";

// ─── Config ──────────────────────────────────────────────────────────────────

const HIANIME_BASE  = import.meta.env.VITE_API_URL;       // e.g. https://my-scraper.railway.app/api
const CONSUMET_BASE = import.meta.env.VITE_CONSUMET_URL;  // e.g. https://my-consumet.railway.app

const GOGO_BASE = `${CONSUMET_BASE}/anime/gogoanime`;
const META_BASE = `${CONSUMET_BASE}/meta/anilist`;

const TIMEOUT = 8000; // ms before we give up on primary

// ─── Low-level fetch helpers ──────────────────────────────────────────────────

async function hiAnime(path, params = {}) {
  const { data } = await axios.get(`${HIANIME_BASE}${path}`, {
    params,
    timeout: TIMEOUT,
  });
  return data;
}

async function gogo(path, params = {}) {
  const { data } = await axios.get(`${GOGO_BASE}${path}`, {
    params,
    timeout: TIMEOUT,
  });
  return data;
}

async function meta(path, params = {}) {
  const { data } = await axios.get(`${META_BASE}${path}`, {
    params,
    timeout: TIMEOUT,
  });
  return data;
}

/**
 * Try the primary (HiAnime) call; on any error, run the fallback (GogoAnime).
 * Both functions must return the already-normalised result.
 */
async function withFallback(primaryFn, fallbackFn) {
  try {
    return await primaryFn();
  } catch (err) {
    console.warn("[API] HiAnime failed:", err.message, "→ falling back to GogoAnime");
    if (!CONSUMET_BASE) {
      console.error("[API] No VITE_CONSUMET_URL set — cannot fall back.");
      throw err;
    }
    return await fallbackFn();
  }
}

// ─── Normalizers (GogoAnime → HiAnime shape) ─────────────────────────────────

import {
  normalizeGogoHome,
  normalizeGogoAnimeInfo,
  normalizeGogoStream,
  normalizeGogoEpisodes,
  normalizeGogoSearch,
  normalizeGogoSuggestions,
  normalizeGogoServers,
} from "./normalizers/gogo.normalizer.js";

// ─── Public API ───────────────────────────────────────────────────────────────

/** Home page data — trending, spotlight, latest episodes, schedule… */
export async function fetchHome() {
  return withFallback(
    async () => {
      const data = await hiAnime("/");
      return data.results ?? null;
    },
    async () => {
      const [recent, airing] = await Promise.all([
        gogo("/recent-episodes", { page: 1, type: 1 }),
        gogo("/top-airing", { page: 1 }),
      ]);
      return normalizeGogoHome(recent, airing);
    }
  );
}

/** Full anime metadata by ID */
export async function fetchAnimeInfo(id, random = false) {
  return withFallback(
    async () => {
      if (random) {
        const r = await hiAnime("/random/id");
        const info = await hiAnime("/info", { id: r.results });
        return info.results;
      }
      const data = await hiAnime("/info", { id });
      return data.results;
    },
    async () => {
      // GogoAnime IDs differ from HiAnime IDs.
      // Try searching by ID first; if that fails, do a title search.
      try {
        const data = await gogo(`/info`, { id });
        return normalizeGogoAnimeInfo(data);
      } catch {
        // Random fallback — just grab top result from search
        const search = await gogo(`/${id}`);
        const first = search.results?.[0];
        if (!first) throw new Error("No GogoAnime result for id: " + id);
        const info = await gogo(`/info`, { id: first.id });
        return normalizeGogoAnimeInfo(info);
      }
    }
  );
}

/** Episode list for an anime */
export async function fetchEpisodes(id) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/episodes/${id}`);
      return data.results;
    },
    async () => {
      const data = await gogo(`/info`, { id });
      return normalizeGogoEpisodes(data);
    }
  );
}

/** Streaming links for an episode */
export async function fetchStream(animeId, episodeId, serverName, type) {
  return withFallback(
    async () => {
      const data = await hiAnime(
        `/stream?id=${animeId}?ep=${episodeId}&server=${serverName}&type=${type}`
      );
      return data.results;
    },
    async () => {
      // episodeId for gogo looks like "anime-slug-episode-1"
      const gogoEpId = episodeId.includes("-episode-")
        ? episodeId
        : `${animeId}-episode-${episodeId}`;
      const data = await gogo(`/watch/${gogoEpId}`);
      return normalizeGogoStream(data);
    }
  );
}

/** Available streaming servers for an episode */
export async function fetchServers(animeId, episodeId) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/servers/${animeId}`, { ep: episodeId });
      return data.results;
    },
    async () => {
      const gogoEpId = episodeId.includes("-episode-")
        ? episodeId
        : `${animeId}-episode-${episodeId}`;
      const data = await gogo(`/servers/${gogoEpId}`);
      return normalizeGogoServers(data);
    }
  );
}

/** Full-text search */
export async function fetchSearch(keyword, page = 1) {
  return withFallback(
    async () => {
      const data = await hiAnime("/search", { keyword, page });
      return data.results;
    },
    async () => {
      const data = await gogo(`/${encodeURIComponent(keyword)}`, { page });
      return normalizeGogoSearch(data);
    }
  );
}

/** Search suggestions / typeahead */
export async function fetchSearchSuggestions(keyword) {
  return withFallback(
    async () => {
      const data = await hiAnime("/search/suggest", { keyword });
      return data.results;
    },
    async () => {
      // Consumet doesn't have a dedicated suggestions endpoint;
      // fire a lightweight search and return the first 8 results normalised.
      const data = await gogo(`/${encodeURIComponent(keyword)}`, { page: 1 });
      return normalizeGogoSuggestions(data);
    }
  );
}

/** Category pages (recently-updated, top-airing, movies…) */
export async function fetchCategory(path, page) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/${path}`, { page });
      return data.results;
    },
    async () => {
      // Map known HiAnime category slugs to GogoAnime equivalents
      const categoryMap = {
        "recently-updated": async () => gogo("/recent-episodes", { page, type: 1 }),
        "top-airing":       async () => gogo("/top-airing", { page }),
        "movies":           async () => meta("/", { page, type: "MOVIE" }),
        "subbed-anime":     async () => gogo("/recent-episodes", { page, type: 1 }),
        "dubbed-anime":     async () => gogo("/recent-episodes", { page, type: 2 }),
      };
      const fn = categoryMap[path] ?? (() => gogo("/top-airing", { page }));
      const data = await fn();
      return normalizeGogoSearch(data);
    }
  );
}

/** Airing schedule for a date (YYYY-MM-DD) */
export async function fetchSchedule(date) {
  return withFallback(
    async () => {
      const data = await hiAnime("/schedule", { date });
      return data.results;
    },
    async () => {
      // Consumet Anilist meta has a schedule endpoint
      const data = await meta("/airing-schedule", { page: 1, weekStart: date, weekEnd: date });
      return data.results ?? [];
    }
  );
}

/** Next episode schedule for a specific anime */
export async function fetchNextEpisodeSchedule(id) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/schedule/${id}`);
      return data.results;
    },
    async () => {
      const data = await gogo(`/info`, { id });
      // Return basic info about remaining episodes
      const episodes = data?.episodes ?? [];
      const lastEp = episodes[episodes.length - 1];
      return lastEp ? { nextEpisode: lastEp.number + 1 } : null;
    }
  );
}

/** Quick-tip / hover card info */
export async function fetchQtip(id) {
  return withFallback(
    async () => {
      const workerUrls = import.meta.env.VITE_WORKER_URL?.split(",");
      const baseUrl = workerUrls?.length
        ? workerUrls[Math.floor(Math.random() * workerUrls.length)]
        : HIANIME_BASE;
      const { data } = await axios.get(`${baseUrl}/qtip/${id.split("-").pop()}`, {
        timeout: TIMEOUT,
      });
      return data.results;
    },
    async () => {
      // Use GogoAnime info as a quick-tip substitute
      const data = await gogo(`/info`, { id });
      return normalizeGogoAnimeInfo(data);
    }
  );
}

/** Top search terms */
export async function fetchTopSearch() {
  return withFallback(
    async () => {
      const workerUrls = import.meta.env.VITE_WORKER_URL?.split(",");
      const baseUrl = workerUrls?.length
        ? workerUrls[Math.floor(Math.random() * workerUrls.length)]
        : HIANIME_BASE;
      const { data } = await axios.get(`${baseUrl}/top-search`, { timeout: TIMEOUT });
      return data?.results ?? [];
    },
    async () => {
      const data = await gogo("/top-airing", { page: 1 });
      return (data?.results ?? []).slice(0, 10).map((a) => ({
        id: a.id,
        title: a.title,
        image: a.image,
      }));
    }
  );
}

/** Producer / studio anime list */
export async function fetchProducer(producer, page) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/producer/${producer}`, { page });
      return data.results;
    },
    async () => {
      // Search by studio name as a keyword fallback
      const data = await gogo(`/${encodeURIComponent(producer)}`, { page });
      return normalizeGogoSearch(data);
    }
  );
}

/** Voice actor / character list */
export async function fetchVoiceActor(id, page) {
  return withFallback(
    async () => {
      const data = await hiAnime(`/character/list/${id}`, { page });
      return data.results;
    },
    async () => {
      // Consumet doesn't expose character endpoints on GogoAnime;
      // return empty gracefully so the UI doesn't crash.
      return { characters: [], page: 1, totalPages: 1 };
    }
  );
}
