import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getProfile } from "../services/hospitalService";

function Profile() {
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======================================
  // Load Hospital Profile
  // ======================================

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getProfile();

      setHospital(response.data.hospital);
    } catch (error) {
      console.log("Profile Error:", error);

      // Token expired or invalid
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ======================================
  // Load Profile When Page Opens
  // ======================================

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ======================================
  // Logout
  // ======================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#eef2f7",
      }}
    >
      {/* ==================================
          Sidebar
      ================================== */}

      <Sidebar />

      {/* ==================================
          Main Content
      ================================== */}

      <div
        style={{
          flex: 1,
          marginLeft: "220px",
        }}
      >
        {/* Navbar */}

        <Navbar />

        {/* ==================================
            Profile Content
        ================================== */}

        <div
          style={{
            padding: "30px",
          }}
        >
          {/* Page Title */}

          <h1
            style={{
              marginBottom: "25px",
              fontSize: "32px",
            }}
          >
            👤 Hospital Profile
          </h1>

          {/* ==================================
              Loading
          ================================== */}

          {loading && (
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "10px",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.1)",
                maxWidth: "650px",
              }}
            >
              <p>Loading profile...</p>
            </div>
          )}

          {/* ==================================
              Profile Not Found
          ================================== */}

          {!loading && !hospital && (
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "10px",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.1)",
                maxWidth: "650px",
              }}
            >
              <h3>Unable to load hospital profile.</h3>

              <button
                onClick={loadProfile}
                style={{
                  marginTop: "15px",
                  padding: "10px 20px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                🔄 Retry
              </button>
            </div>
          )}

          {/* ==================================
              Hospital Profile Card
          ================================== */}

          {!loading && hospital && (
            <div
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "650px",
                boxShadow:
                  "0 3px 12px rgba(0,0,0,0.12)",
              }}
            >
              {/* Hospital Name */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "55px",
                    height: "55px",
                    borderRadius: "50%",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                  }}
                >
                  🏥
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                    }}
                  >
                    {hospital.hospitalName}
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                    }}
                  >
                    Registered Hospital
                  </p>
                </div>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #ddd",
                  marginBottom: "25px",
                }}
              />

              {/* ==================================
                  Hospital Information
              ================================== */}

              <div
                style={{
                  lineHeight: "1.8",
                  fontSize: "16px",
                }}
              >
                <p>
                  <strong>📧 Email:</strong>{" "}
                  {hospital.email || "N/A"}
                </p>

                <p>
                  <strong>📞 Phone:</strong>{" "}
                  {hospital.phone || "N/A"}
                </p>

                <p>
                  <strong>📍 Address:</strong>{" "}
                  {hospital.address || "N/A"}
                </p>

                <p>
                  <strong>🌐 Latitude:</strong>{" "}
                  {hospital.latitude ?? "N/A"}
                </p>

                <p>
                  <strong>🌐 Longitude:</strong>{" "}
                  {hospital.longitude ?? "N/A"}
                </p>
              </div>

              {/* ==================================
                  Logout Section
              ================================== */}

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #ddd",
                  margin: "30px 0 20px",
                }}
              />

              <h3
                style={{
                  marginBottom: "15px",
                }}
              >
                Account
              </h3>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;