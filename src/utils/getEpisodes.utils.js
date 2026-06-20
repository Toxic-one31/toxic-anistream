import { fetchEpisodes } from "@/src/services/api.service.js";

export default async function getEpisodes(id) {
  try {
    return await fetchEpisodes(id);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return error;
  }
}
