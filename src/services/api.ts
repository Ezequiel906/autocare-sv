import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error("VITE_API_URL environment variable is required.");
}

axios.defaults.baseURL = apiUrl.replace(/\/+$/, "");
