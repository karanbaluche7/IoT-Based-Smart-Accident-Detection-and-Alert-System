import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://10.48.38.61:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT automatically
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

// Centralized authentication handling
api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// =====================================================
// HOSPITAL PROFILE
// =====================================================

export const getProfile = async () => {
  const response = await api.get("/hospitals/profile");
  return response.data;
};

// =====================================================
// ACCIDENT APIs
// =====================================================

// Get all accidents assigned to the logged-in hospital
export const getAllAccidents = async () => {
  const response = await api.get("/accidents");
  return response.data;
};

// Get one accident by ID
export const getAccidentById = async (id) => {
  const response = await api.get(`/accidents/${id}`);
  return response.data;
};

// Update accident status
export const updateAccidentStatus = async (id, status) => {
  const response = await api.put(`/accidents/${id}`, {
    status,
  });

  return response.data;
};

// Send accident to another nearby hospital
export const sendToNearbyHospital = async (id) => {
  const response = await api.put(
    `/accidents/${id}/send-nearby-hospital`
  );

  return response.data;
};

// Delete accident
export const deleteAccident = async (id) => {
  const response = await api.delete(`/accidents/${id}`);
  return response.data;
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default api;