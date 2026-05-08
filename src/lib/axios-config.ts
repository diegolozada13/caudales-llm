import axios from "axios";

const apiUrl = process.env.SAIH_API_URL || "https://api-saih-public.chj.es:3000/";

export const saihClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

saihClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    throw error;
  },
);

export default saihClient;
