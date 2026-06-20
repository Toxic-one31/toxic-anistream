import { fetchTopSearch } from "@/src/services/api.service.js";

const getTopSearch = async () => {
  try {
    const stored = localStorage.getItem("topSearch");
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000) return data;
    }

    const results = await fetchTopSearch();
    if (results?.length) {
      localStorage.setItem("topSearch", JSON.stringify({ data: results, timestamp: Date.now() }));
    }
    return results ?? [];
  } catch (error) {
    console.error("Error fetching top search:", error);
    return null;
  }
};

export default getTopSearch;
