import api from "./api";

// ==========================================
// GET ALL ACCIDENTS
// ==========================================
export const getAllAccidents = () => {
  return api.get("/accidents", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// ==========================================
// GET ACCIDENT BY ID
// ==========================================
export const getAccidentById = (id) => {
  return api.get(`/accidents/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// ==========================================
// UPDATE ACCIDENT STATUS
// ==========================================
export const updateAccidentStatus = (id, status) => {
  return api.put(
    `/accidents/${id}`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};

// ==========================================
// DELETE ACCIDENT
// ==========================================
export const deleteAccident = (id) => {
  return api.delete(`/accidents/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

// ==========================================
// 🚑 SEND TO NEARBY HOSPITAL
// ==========================================
export const sendToNearbyHospital = (accidentId) => {
  return api.put(
    `/accidents/${accidentId}/send-nearby-hospital`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};