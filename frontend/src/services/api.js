import axios from "axios";
import server from "../environment";

const api = axios.create({
  baseURL: `${server}/api/v1`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

