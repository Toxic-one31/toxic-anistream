import { fetchCategory } from "@/src/services/api.service.js";

const getCategoryInfo = async (path, page) => {
  try {
    return await fetchCategory(path, page);
  } catch (err) {
    console.error("Error fetching category:", err);
    return err;
  }
};

export default getCategoryInfo;
