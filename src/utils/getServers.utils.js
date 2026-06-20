import { fetchServers } from "@/src/services/api.service.js";

export default async function getServers(animeId, episodeId) {
  try {
    return await fetchServers(animeId, episodeId);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return error;
  }
}
