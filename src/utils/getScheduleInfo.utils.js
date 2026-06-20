import { fetchSchedule } from "@/src/services/api.service.js";

export default async function getSchedInfo(date) {
  try {
    return await fetchSchedule(date);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return error;
  }
}
