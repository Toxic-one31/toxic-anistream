import { fetchStream } from "@/src/services/api.service.js";

export default async function getStreamInfo(animeId, episodeId, serverName, type) {
  try {
    return await fetchStream(animeId, episodeId, serverName, type);
  } catch (error) {
    console.error("Error fetching stream info:", error);
    return error;
  }
}
