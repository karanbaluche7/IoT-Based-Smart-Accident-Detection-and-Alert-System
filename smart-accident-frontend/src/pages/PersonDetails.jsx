import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import axios from "axios";

function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `http://localhost:5000/api/accidents/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAccident(response.data.accident);
      } catch (error) {
        console.error(
          "Person Details Error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Unable to load person details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPersonDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div>
        <Sidebar />

        <div style={{ marginLeft: "220px" }}>
          <Navbar />

          <div style={{ padding: "40px" }}>
            <h2>Loading person details...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!accident) {
    return (
      <div>
        <Sidebar />

        <div style={{ marginLeft: "220px" }}>
          <Navbar />

          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2>Person details not found</h2>

            <button
              onClick={() => navigate("/live-accidents")}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              ← Back to Live Accidents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#eef2f7",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: "220px",
        }}
      >
        <Navbar />

        <div style={{ padding: "30px" }}>
          <button
            onClick={() => navigate("/live-accidents")}
            style={{
              padding: "10px 18px",
              background: "#64748b",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            ← Back
          </button>

          <h1>👤 Person Details</h1>

          <p style={{ color: "#64748b" }}>
            Personal information associated with this
            accident
          </p>

          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.1)",
              maxWidth: "800px",
              marginTop: "20px",
            }}
          >
            <h2>👤 Personal Information</h2>

            <hr />

            <Detail
              label="Person Name"
              value={accident.personName}
            />

            <Detail
              label="Date of Birth"
              value={accident.dateOfBirth}
            />

            <Detail
              label="Gender"
              value={accident.gender}
            />

            <Detail
              label="Blood Group"
              value={accident.bloodGroup}
            />

            <Detail
              label="Phone Number"
              value={accident.phoneNumber}
            />

            <Detail
              label="Parent Phone Number"
              value={accident.parentPhoneNumber}
            />

            <Detail
              label="Person Address"
              value={accident.personAddress}
            />

            <hr />

            <h2>🚗 Vehicle Information</h2>

            <Detail
              label="Vehicle Number"
              value={accident.vehicleNumber}
            />

            <Detail
              label="Device ID"
              value={accident.deviceId}
            />

            <hr />

            <h2>🚨 Accident Information</h2>

            <Detail
              label="Accident Type"
              value={accident.accidentType}
            />

            <Detail
              label="Severity"
              value={accident.severity}
            />

            <Detail
              label="Accident Address"
              value={accident.address}
            />

            <Detail
              label="Latitude"
              value={accident.latitude}
            />

            <Detail
              label="Longitude"
              value={accident.longitude}
            />

            <Detail
              label="Status"
              value={accident.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        padding: "12px 0",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <strong>{label}</strong>

      <span
        style={{
          color: "#475569",
          textAlign: "right",
        }}
      >
        {value || "Not Available"}
      </span>
    </div>
  );
}

export default PersonDetails;