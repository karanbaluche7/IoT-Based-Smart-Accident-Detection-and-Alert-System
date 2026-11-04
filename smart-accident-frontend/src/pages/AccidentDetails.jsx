import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function AccidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======================================
  // FETCH ACCIDENT DETAILS
  // ======================================

  useEffect(() => {
    const fetchAccidentDetails = async () => {
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

        console.log("Accident Details:", response.data);

        setAccident(response.data.accident);
      } catch (error) {
        console.error("Accident Details Error:", error);

        toast.error(
          error.response?.data?.message ||
            "Unable to load accident details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAccidentDetails();
    }
  }, [id]);

  // ======================================
  // LOADING
  // ======================================

  if (loading) {
    return (
      <div style={pageStyle}>
        <Sidebar />

        <div style={contentStyle}>
          <Navbar />

          <div style={loadingStyle}>
            <h2>Loading accident details...</h2>
          </div>
        </div>
      </div>
    );
  }

  // ======================================
  // NOT FOUND
  // ======================================

  if (!accident) {
    return (
      <div style={pageStyle}>
        <Sidebar />

        <div style={contentStyle}>
          <Navbar />

          <div style={notFoundStyle}>
            <h2>Accident details not found</h2>

            <button
              onClick={() => navigate("/history")}
              style={backButtonStyle}
            >
              ← Back to Accident History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================================
  // MAIN PAGE
  // ======================================

  return (
    <div style={pageStyle}>
      <Sidebar />

      <div style={contentStyle}>
        <Navbar />

        <div style={mainContentStyle}>

          {/* ==================================
              BACK BUTTON
          ================================== */}

          <button
            onClick={() => navigate("/history")}
            style={backButtonStyle}
          >
            ← Back to Accident History
          </button>

          {/* ==================================
              PAGE TITLE
          ================================== */}

          <h1 style={titleStyle}>
            📋 Accident Details
          </h1>

          <p style={subtitleStyle}>
            Complete information about this accident
            record.
          </p>

          {/* ==================================
              PERSON INFORMATION
          ================================== */}

          <Section title="👤 Person Information">

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

          </Section>

          {/* ==================================
              DEVICE & VEHICLE INFORMATION
          ================================== */}

          <Section title="📱 Device & Vehicle Information">

            <Detail
              label="Device ID"
              value={accident.deviceId}
            />

            <Detail
              label="Vehicle Number"
              value={accident.vehicleNumber}
            />

          </Section>

          {/* ==================================
              ACCIDENT INFORMATION
          ================================== */}

          <Section title="🚨 Accident Information">

            <Detail
              label="Accident Type"
              value={accident.accidentType}
            />

            <Detail
              label="Severity"
              value={accident.severity}
              highlight
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

            <Detail
              label="Date & Time"
              value={
                accident.timestamp
                  ? new Date(
                      accident.timestamp
                    ).toLocaleString()
                  : "Not Available"
              }
            />

          </Section>

          {/* ==================================
              SENSOR INFORMATION
          ================================== */}

          <Section title="📊 Sensor Information">

            <Detail
              label="Accelerometer X"
              value={accident.accelerometerX}
            />

            <Detail
              label="Accelerometer Y"
              value={accident.accelerometerY}
            />

            <Detail
              label="Accelerometer Z"
              value={accident.accelerometerZ}
            />

            <Detail
              label="Acceleration Delta"
              value={accident.accelerationDelta}
            />

            <Detail
              label="Vibration Detected"
              value={
                accident.vibrationDetected
                  ? "Yes"
                  : "No"
              }
            />

          </Section>

          {/* ==================================
              HOSPITAL INFORMATION
          ================================== */}

          <Section title="🏥 Hospital Information">

            <Detail
              label="Assigned Hospital"
              value={
                accident.assignedHospital
                  ?.hospitalName
              }
            />

            <Detail
              label="Hospital Phone"
              value={
                accident.assignedHospital
                  ?.phone
              }
            />

            <Detail
              label="Hospital Address"
              value={
                accident.assignedHospital
                  ?.address
              }
            />

            <Detail
              label="Hospital Latitude"
              value={
                accident.assignedHospital
                  ?.latitude
              }
            />

            <Detail
              label="Hospital Longitude"
              value={
                accident.assignedHospital
                  ?.longitude
              }
            />

            <Detail
              label="Distance from Accident"
              value={
                accident.distance !== undefined &&
                accident.distance !== null
                  ? `${accident.distance} km`
                  : "Not Available"
              }
            />

          </Section>

          {/* ==================================
              RECORD INFORMATION
          ================================== */}

          <Section title="🗂️ Record Information">

            <Detail
              label="Accident ID"
              value={accident._id}
            />

            <Detail
              label="Created At"
              value={
                accident.createdAt
                  ? new Date(
                      accident.createdAt
                    ).toLocaleString()
                  : "Not Available"
              }
            />

            <Detail
              label="Last Updated"
              value={
                accident.updatedAt
                  ? new Date(
                      accident.updatedAt
                    ).toLocaleString()
                  : "Not Available"
              }
            />

          </Section>

          {/* ==================================
              BACK BUTTON
          ================================== */}

          <button
            onClick={() => navigate("/history")}
            style={{
              ...backButtonStyle,
              marginTop: "30px",
              marginBottom: "30px",
            }}
          >
            ← Back to Accident History
          </button>

        </div>
      </div>
    </div>
  );
}

// ======================================
// SECTION COMPONENT
// ======================================

function Section({ title, children }) {
  return (
    <div style={sectionStyle}>

      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <hr style={dividerStyle} />

      <div>
        {children}
      </div>

    </div>
  );
}

// ======================================
// DETAIL COMPONENT
// ======================================

function Detail({
  label,
  value,
  highlight = false,
}) {
  const displayValue =
    value !== undefined &&
    value !== null &&
    value !== ""
      ? value
      : "Not Available";

  return (
    <div style={detailStyle}>

      <strong style={labelStyle}>
        {label}
      </strong>

      <span
        style={{
          ...valueStyle,
          color: highlight
            ? "#dc2626"
            : "#475569",
          fontWeight: highlight
            ? "700"
            : "400",
        }}
      >
        {displayValue}
      </span>

    </div>
  );
}

// ======================================
// PAGE STYLES
// ======================================

const pageStyle = {
  minHeight: "100vh",
  background: "#eef2f7",
};

const contentStyle = {
  marginLeft: "220px",
};

const mainContentStyle = {
  padding: "30px",
};

const loadingStyle = {
  padding: "40px",
};

const notFoundStyle = {
  padding: "40px",
  textAlign: "center",
};

const titleStyle = {
  marginTop: "20px",
  marginBottom: "8px",
  color: "#1e293b",
};

const subtitleStyle = {
  color: "#64748b",
  marginBottom: "20px",
};

const sectionStyle = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "12px",
  marginTop: "25px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
  maxWidth: "1000px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "15px",
  color: "#1e293b",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  marginBottom: "5px",
};

const detailStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "30px",
  padding: "13px 0",
  borderBottom: "1px solid #f1f5f9",
};

const labelStyle = {
  color: "#334155",
  minWidth: "220px",
};

const valueStyle = {
  textAlign: "right",
  wordBreak: "break-word",
};

const backButtonStyle = {
  padding: "10px 18px",
  background: "#64748b",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

export default AccidentDetails;