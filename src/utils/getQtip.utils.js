import { fetchQtip } from "@/src/services/api.service.js";

const getQtip = async (id) => {
  try {
    return await fetchQtip(id);
  } catch (err) {
    console.error("Error fetching qtip:", err);
    return null;
  }
};

export default getQtip;
