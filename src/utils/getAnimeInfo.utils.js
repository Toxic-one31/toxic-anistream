import { fetchAnimeInfo } from "@/src/services/api.service.js";

export default async function getAnimeInfo(id, random = false) {
  try {
    return await fetchAnimeInfo(id, random);
  } catch (error) {
    console.error("Error fetching anime info:", error);
    return error;
  }
}
