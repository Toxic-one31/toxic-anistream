import { fetchProducer } from "@/src/services/api.service.js";

const getProducer = async (producer, page) => {
  try {
    return await fetchProducer(producer, page);
  } catch (err) {
    console.error("Error fetching producer:", err);
    return err;
  }
};

export default getProducer;
