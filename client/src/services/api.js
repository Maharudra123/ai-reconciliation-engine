import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const fetchReconciliationReport = async () => {
  try {
    const response = await axios.get(`${API_URL}/reconcile`);
    return response.data;
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};
