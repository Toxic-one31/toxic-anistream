import { fetchHome } from "@/src/services/api.service.js";

const CACHE_KEY      = "homeInfoCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

export default async function getHomeInfo() {
  const currentTime  = Date.now();
  const cachedData   = JSON.parse(localStorage.getItem(CACHE_KEY));

  if (cachedData && currentTime - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  const data = await fetchHome();
  if (!data || Object.keys(data).length === 0) return null;

  const {
    spotlights, trending, topten, todaySchedule,
    top_airing, most_popular, most_favorite,
    latest_completed, latest_episode, top_upcoming,
    recently_added, genres,
  } = data;

  const toCache = {
    data: {
      spotlights, trending, topten, todaySchedule,
      top_airing, most_popular, most_favorite,
      latest_completed, latest_episode, top_upcoming,
      recently_added, genres,
    },
    timestamp: currentTime,
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
  return toCache.data;
}
