import { fetchSearch } from "@/src/services/api.service.js";

const getSearch = async (keyword, page = 1) => {
  try {
    return await fetchSearch(keyword, page);
  } catch (err) {
    console.error("Error fetching search:", err);
    return err;
  }
};

export default getSearch;
