import api from "./api";

export const getProfile = () => {
  return api.get("/hospitals/profile", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// ======================================
// Get All Registered Hospitals
// ======================================

export const getAllHospitals = () => {
  return api.get("/hospitals", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};