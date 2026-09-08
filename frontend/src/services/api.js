import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) {
    return "Unable to connect to the server.";
  }

  if (error.response.status === 401) {
    return "Session expired. Please sign in again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.response.status === 500) {
    return "Something went wrong on the server.";
  }

  if (error.response.status === 404) {
    return "The requested record could not be found.";
  }

  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default api;