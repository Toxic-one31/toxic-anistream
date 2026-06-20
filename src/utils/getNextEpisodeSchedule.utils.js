import { fetchNextEpisodeSchedule } from "@/src/services/api.service.js";

const getNextEpisodeSchedule = async (id) => {
  try {
    return await fetchNextEpisodeSchedule(id);
  } catch (err) {
    console.error("Error fetching next episode schedule:", err);
    return err;
  }
};

export default getNextEpisodeSchedule;
