/**
 * GogoAnime → HiAnime response normalizers
 *
 * Consumet's GogoAnime API returns a different shape to the HiAnime scraper.
 * These functions translate every GogoAnime response into the HiAnime shape
 * so the rest of the app is source-agnostic.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toHiAnimeId = (gogoId) => gogoId; // keep as-is; the app just passes it back

function gogoAnimeCard(a) {
  return {
    id: toHiAnimeId(a.id),
    title: a.title ?? a.animeTitle ?? "",
    poster: a.image ?? a.animeImg ?? "",
    japanese_title: a.otherName ?? null,
    type: a.type ?? a.subOrDub ?? "SUB",
    duration: a.duration ?? null,
    rating: null,
    episodes: {
      sub: a.totalEpisodes ?? a.episodes?.length ?? null,
      dub: null,
    },
  };
}

// ─── Home normalizer ─────────────────────────────────────────────────────────

/**
 * Assembles a HiAnime-shaped home object from:
 *   recent  → Consumet /anime/gogoanime/recent-episodes
 *   airing  → Consumet /anime/gogoanime/top-airing
 */
export function normalizeGogoHome(recent, airing) {
  const recentResults = recent?.results ?? [];
  const airingResults = airing?.results ?? [];

  // Build spotlight from top 5 airing anime
  const spotlights = airingResults.slice(0, 5).map((a, i) => ({
    id: a.id,
    title: a.title,
    poster: a.image,
    number: i + 1,
    description: a.genres?.join(", ") ?? "",
    banner: a.image, // gogo doesn't supply banners
    otherInfo: [],
  }));

  // Recent episodes → latest_episode
  const latest_episode = recentResults.map((a) => ({
    id: a.id,
    title: a.animeTitle ?? a.title,
    poster: a.animeImg ?? a.image,
    type: a.subOrDub ?? "SUB",
    episode: { id: a.episodeId, number: Number(a.episodeNum) || 1 },
  }));

  // Top airing → both trending and top_airing
  const trending = airingResults.map((a, i) => ({
    ...gogoAnimeCard(a),
    rank: i + 1,
  }));

  const top_airing = airingResults.map(gogoAnimeCard);

  return {
    spotlights,
    trending,
    topten: {
      today: airingResults.slice(0, 10).map((a, i) => ({ ...gogoAnimeCard(a), rank: i + 1 })),
      week:  airingResults.slice(0, 10).map((a, i) => ({ ...gogoAnimeCard(a), rank: i + 1 })),
      month: airingResults.slice(0, 10).map((a, i) => ({ ...gogoAnimeCard(a), rank: i + 1 })),
    },
    latest_episode,
    top_airing,
    most_popular:     airingResults.map(gogoAnimeCard),
    most_favorite:    airingResults.map(gogoAnimeCard),
    latest_completed: recentResults.map(gogoAnimeCard),
    top_upcoming:     [],
    recently_added:   recentResults.map(gogoAnimeCard),
    genres:           [],           // GogoAnime doesn't expose a genre list at root
    todaySchedule:    [],
  };
}

// ─── Anime info normalizer ────────────────────────────────────────────────────

/**
 * Consumet GogoAnime /info response → HiAnime /info shape
 *
 * Consumet:
 *   { id, title, url, genres, totalEpisodes, image, releaseDate, description,
 *     subOrDub, type, status, otherName, episodes: [{id, number, url}] }
 *
 * HiAnime:
 *   { id, title, poster, animeInfo: { overview, tvInfo, genres, ... }, episodes: [...] }
 */
export function normalizeGogoAnimeInfo(d) {
  const episodes = (d.episodes ?? []).map((ep) => ({
    id: ep.id,
    number: ep.number,
    isFiller: false,
    title: `Episode ${ep.number}`,
  }));

  return {
    id: d.id,
    title: d.title,
    japanese_title: d.otherName ?? null,
    poster: d.image,
    episodes: {
      sub: d.subOrDub === "dub" ? 0 : d.totalEpisodes ?? episodes.length,
      dub: d.subOrDub === "dub" ? d.totalEpisodes ?? episodes.length : 0,
      total: d.totalEpisodes ?? episodes.length,
    },
    animeInfo: {
      overview: d.description ?? "",
      tvInfo: {
        showtype: d.type ?? "TV",
        status: d.status ?? "Unknown",
        rating: null,
        aired: d.releaseDate ?? null,
        sub: d.subOrDub !== "dub" ? (d.totalEpisodes ?? episodes.length) : 0,
        dub: d.subOrDub === "dub" ? (d.totalEpisodes ?? episodes.length) : 0,
        total_episodes: d.totalEpisodes ?? episodes.length,
      },
      genres: d.genres ?? [],
      producers: [],
      studios: [],
    },
    episodeList: episodes,
    related: [],
    recommended: [],
    characters: [],
    voiceActors: [],
    seasons: [],
  };
}

// ─── Episodes normalizer ──────────────────────────────────────────────────────

/**
 * Consumet GogoAnime /info → HiAnime /episodes/{id} shape
 *
 * HiAnime returns: { episodes: [{id, number, isFiller, title}], totalEpisodes }
 */
export function normalizeGogoEpisodes(d) {
  const episodes = (d.episodes ?? []).map((ep) => ({
    id: ep.id,
    number: ep.number,
    isFiller: false,
    title: `Episode ${ep.number}`,
  }));

  return {
    totalEpisodes: d.totalEpisodes ?? episodes.length,
    episodes,
  };
}

// ─── Stream normalizer ────────────────────────────────────────────────────────

/**
 * Consumet GogoAnime /watch/{episodeId} → HiAnime /stream shape
 *
 * Consumet:
 *   { headers: {Referer}, sources: [{url, quality, isM3U8}], download }
 *
 * HiAnime:
 *   { streamingLink: { link: [{quality, url, isM3U8}], tracks: [] }, server }
 */
export function normalizeGogoStream(d) {
  const sources = d.sources ?? [];

  const link = sources.map((s) => ({
    quality: s.quality ?? "default",
    url: s.url,
    isM3U8: s.isM3U8 ?? s.url?.includes(".m3u8") ?? false,
    type: "",
  }));

  // Sort: auto/default first, then by quality descending
  const qualityOrder = ["1080p", "720p", "480p", "360p", "default", "backup"];
  link.sort((a, b) => {
    const ai = qualityOrder.indexOf(a.quality);
    const bi = qualityOrder.indexOf(b.quality);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return {
    streamingLink: {
      link,
      tracks: [],           // GogoAnime doesn't provide subtitle tracks
      intro: null,
      outro: null,
    },
    server: "gogoanime",
    headers: d.headers ?? {},
    download: d.download ?? null,
  };
}

// ─── Servers normalizer ───────────────────────────────────────────────────────

/**
 * Consumet GogoAnime /servers/{episodeId} → HiAnime /servers shape
 *
 * Consumet: [ { name, url } ]
 * HiAnime:  { sub: [{serverId, serverName}], dub: [], raw: [] }
 */
export function normalizeGogoServers(data) {
  const servers = Array.isArray(data) ? data : (data?.servers ?? []);

  const sub = servers.map((s, i) => ({
    serverId: i + 1,
    serverName: s.name ?? `Server ${i + 1}`,
  }));

  return { sub, dub: [], raw: [] };
}

// ─── Search normalizer ────────────────────────────────────────────────────────

/**
 * Consumet GogoAnime search → HiAnime /search shape
 *
 * Consumet: { currentPage, hasNextPage, results: [{id, title, image, url, genres}] }
 * HiAnime:  { animes: [...], currentPage, totalPages, hasNextPage }
 */
export function normalizeGogoSearch(d) {
  const animes = (d?.results ?? []).map(gogoAnimeCard);

  return {
    animes,
    currentPage: d?.currentPage ?? 1,
    totalPages: d?.totalPages ?? 1,
    hasNextPage: d?.hasNextPage ?? false,
    totalAnime: animes.length,
  };
}

// ─── Suggestions normalizer ───────────────────────────────────────────────────

/**
 * Converts a lightweight GogoAnime search result into the suggestion shape
 * HiAnime uses for typeahead.
 *
 * HiAnime: { suggestions: [{id, title, poster, type, episodes}] }
 */
export function normalizeGogoSuggestions(d) {
  const suggestions = (d?.results ?? []).slice(0, 8).map((a) => ({
    id: a.id,
    title: a.title,
    poster: a.image,
    type: a.type ?? "TV",
    episodes: { sub: null, dub: null },
    moreInfo: a.genres ?? [],
  }));

  return { suggestions };
}
