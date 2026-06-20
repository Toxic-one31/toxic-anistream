import { fetchVoiceActor } from "@/src/services/api.service.js";

export default async function fetchVoiceActorInfo(id, page) {
  try {
    return await fetchVoiceActor(id, page);
  } catch (error) {
    console.error("Error fetching voice actor info:", error);
    return error;
  }
}
