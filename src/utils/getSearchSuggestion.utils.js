import { fetchSearchSuggestions } from "@/src/services/api.service.js";

const getSearchSuggestion = async (keyword) => {
  try {
    return await fetchSearchSuggestions(keyword);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    return err;
  }
};

export default getSearchSuggestion;
