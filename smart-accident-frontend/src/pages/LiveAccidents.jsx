import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  getAllAccidents,
  updateAccidentStatus,
} from "../services/accidentService";

function LiveAccidents() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All");

  const [selectedAccident, setSelectedAccident] =
    useState(null);

  // ==========================================
  // Fetch Accidents
  // ==========================================

  const fetchAccidents = async () => {
    try {
      const response = await getAllAccidents();

      const allAccidents =
        response.data.accidents || [];

      // Only active accidents
      const activeAccidents = allAccidents.filter(
        (item) => item.status === "Active"
      );

      setAccidents(activeAccidents);
    } catch (error) {
      console.log("Live Accident Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error(
          error.response?.data?.message ||
            "Unable to load accidents"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Initial Load + Auto Refresh
  // ==========================================

  useEffect(() => {
    fetchAccidents();

    const interval = setInterval(() => {
      fetchAccidents();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // Resolve Accident
  // ==========================================

  const handleResolve = async (accident) => {
    const confirmResolve = window.confirm(
      "Are you sure you want to resolve this accident?"
    );

    if (!confirmResolve) {
      return;
    }

    try {
      await updateAccidentStatus(
        accident._id,
        "Resolved"
      );

      toast.success(
        "✅ Accident marked as resolved"
      );

      setSelectedAccident(null);

      fetchAccidents();
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          "Unable to resolve accident"
      );
    }
  };

  // ==========================================
  // Search + Filter
  // ==========================================

  const filteredAccidents = accidents.filter(
    (item) => {
      const searchText = search.toLowerCase();

      const hospitalName =
        typeof item.assignedHospital === "object"
          ? item.assignedHospital?.hospitalName || ""
          : item.assignedHospital || "";

      const matchesSearch =
        item.deviceId
          ?.toLowerCase()
          .includes(searchText) ||
        item.accidentType
          ?.toLowerCase()
          .includes(searchText) ||
        item.severity
          ?.toLowerCase()
          .includes(searchText) ||
        item.status
          ?.toLowerCase()
          .includes(searchText) ||
        hospitalName
          .toLowerCase()
          .includes(searchText);

      const matchesSeverity =
        severityFilter === "All" ||
        item.severity === severityFilter;

      return (
        matchesSearch && matchesSeverity
      );
    }
  );

  // ==========================================
  // Person Details
  // ==========================================

  const viewPersonDetails = (accident) => {
    if (!accident?._id) {
      toast.error(
        "Accident information is not available."
      );

      return;
    }

    window.location.href =
      `/person-details/${accident._id}`;
  };

  // ==========================================
  // Google Maps Navigation
  // ==========================================

  const navigateToAccident = (accident) => {
    if (
      accident.latitude == null ||
      accident.longitude == null
    ) {
      toast.error(
        "Accident location is not available."
      );

      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${accident.latitude},${accident.longitude}`;

    window.open(url, "_blank");
  };

  // ==========================================
  // Severity Color
  // ==========================================

  const getSeverityStyle = (severity) => {
    if (severity === "High") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (severity === "Medium") {
      return {
        background: "#ffedd5",
        color: "#ea580c",
      };
    }

    return {
      background: "#dcfce7",
      color: "#16a34a",
    };
  };

  // ==========================================
  // Get Hospital Name
  // ==========================================

  const getHospitalName = (accident) => {
    if (!accident?.assignedHospital) {
      return "Not assigned";
    }

    if (
      typeof accident.assignedHospital ===
      "object"
    ) {
      return (
        accident.assignedHospital.hospitalName ||
        "Not assigned"
      );
    }

    return accident.assignedHospital;
  };

  // ==========================================
  // Render
  // ==========================================

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

        <div
          style={{
            padding: "30px",
          }}
        >
          {/* ==================================
              Heading
          ================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                }}
              >
                🚨 Live Accidents
              </h1>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                Active accidents requiring attention
              </p>
            </div>

            <div
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                padding: "10px 18px",
                borderRadius: "20px",
                fontWeight: "bold",
              }}
            >
              🔴 {accidents.length} Active
            </div>
          </div>

          {/* ==================================
              Search + Filter
          ================================== */}

          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
              marginBottom: "20px",
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search device, accident type, severity..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                flex: 1,
                minWidth: "280px",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />

            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value)
              }
              style={{
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                minWidth: "150px",
              }}
            >
              <option value="All">
                All Severities
              </option>

              <option value="High">
                🔴 High
              </option>

              <option value="Medium">
                🟠 Medium
              </option>

              <option value="Low">
                🟢 Low
              </option>
            </select>
          </div>

          {/* ==================================
              Loading
          ================================== */}

          {loading && (
            <div
              style={{
                background: "#fff",
                padding: "40px",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <h3>
                Loading live accidents...
              </h3>
            </div>
          )}

          {/* ==================================
              No Active Accidents
          ================================== */}

          {!loading &&
            filteredAccidents.length === 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "50px",
                  borderRadius: "10px",
                  textAlign: "center",
                  boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: "50px",
                  }}
                >
                  ✅
                </div>

                <h2>
                  No Active Accidents
                </h2>

                <p
                  style={{
                    color: "#64748b",
                  }}
                >
                  There are currently no active
                  accidents requiring attention.
                </p>
              </div>
            )}

          {/* ==================================
              Accident Cards
          ================================== */}

          {!loading &&
            filteredAccidents.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(330px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredAccidents.map(
                  (accident) => {
                    const severityStyle =
                      getSeverityStyle(
                        accident.severity
                      );

                    return (
                      <div
                        key={accident._id}
                        style={{
                          background: "#fff",
                          borderRadius: "12px",
                          padding: "20px",
                          boxShadow:
                            "0 3px 12px rgba(0,0,0,0.1)",
                          borderLeft:
                            accident.severity ===
                            "High"
                              ? "5px solid #dc2626"
                              : accident.severity ===
                                "Medium"
                              ? "5px solid #f97316"
                              : "5px solid #22c55e",
                        }}
                      >
                        {/* Card Header */}

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                            }}
                          >
                            🚨 Accident
                          </h3>

                          <span
                            style={{
                              ...severityStyle,
                              padding:
                                "6px 10px",
                              borderRadius: "15px",
                              fontSize: "12px",
                              fontWeight:
                                "bold",
                            }}
                          >
                            {accident.severity}
                          </span>
                        </div>

                        {/* Device */}

                        <p>
                          <strong>
                            Device:
                          </strong>{" "}
                          {accident.deviceId}
                        </p>

                        {/* Accident Type */}

                        <p>
                          <strong>
                            Type:
                          </strong>{" "}
                          {accident.accidentType ||
                            "Unknown"}
                        </p>

                        {/* Distance */}

                        <p>
                          <strong>
                            Distance:
                          </strong>{" "}
                          {accident.distance !=
                          null
                            ? `${Number(
                                accident.distance
                              ).toFixed(2)} km`
                            : "Not available"}
                        </p>

                        {/* Assigned Hospital */}

                        <p>
                          <strong>
                            🏥 Assigned Hospital:
                          </strong>{" "}
                          {getHospitalName(accident)}
                        </p>

                        {/* Time */}

                        <p>
                          <strong>
                            ⏰ Time:
                          </strong>{" "}
                          {accident.timestamp
                            ? new Date(
                                accident.timestamp
                              ).toLocaleString()
                            : "N/A"}
                        </p>

                        {/* Location */}

                        <p>
                          <strong>
                            📍 Location:
                          </strong>{" "}
                          {accident.latitude},{" "}
                          {accident.longitude}
                        </p>

                        {/* Buttons */}

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "20px",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* View */}

                          <button
                            onClick={() =>
                              setSelectedAccident(
                                accident
                              )
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              background:
                                "#2563eb",
                              color: "#fff",
                              border: "none",
                              borderRadius:
                                "6px",
                              cursor:
                                "pointer",
                            }}
                          >
                            👁️ View
                          </button>

                          {/* Person Details */}

                          <button
                            onClick={() =>
                              viewPersonDetails(
                                accident
                              )
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              background:
                                "#7c3aed",
                              color: "#fff",
                              border: "none",
                              borderRadius:
                                "6px",
                              cursor:
                                "pointer",
                            }}
                          >
                            👤 Person Details
                          </button>

                          {/* Navigate */}

                          <button
                            onClick={() =>
                              navigateToAccident(
                                accident
                              )
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              background:
                                "#0f766e",
                              color: "#fff",
                              border: "none",
                              borderRadius:
                                "6px",
                              cursor:
                                "pointer",
                            }}
                          >
                            🧭 Navigate
                          </button>

                          {/* Resolve */}

                          <button
                            onClick={() =>
                              handleResolve(
                                accident
                              )
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              background:
                                "#16a34a",
                              color: "#fff",
                              border: "none",
                              borderRadius:
                                "6px",
                              cursor:
                                "pointer",
                            }}
                          >
                            ✅ Resolve
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

          {/* ==================================
              Accident Details Modal
          ================================== */}

          {selectedAccident && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background:
                  "rgba(0,0,0,0.55)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  width: "100%",
                  maxWidth: "600px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  borderRadius: "12px",
                  padding: "30px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2>
                    🚨 Accident Details
                  </h2>

                  <button
                    onClick={() =>
                      setSelectedAccident(null)
                    }
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      fontSize: "25px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <hr />

                <p>
                  <strong>
                    Device ID:
                  </strong>{" "}
                  {selectedAccident.deviceId}
                </p>

                <p>
                  <strong>
                    Accident Type:
                  </strong>{" "}
                  {selectedAccident.accidentType ||
                    "Unknown"}
                </p>

                <p>
                  <strong>
                    Severity:
                  </strong>{" "}
                  {selectedAccident.severity}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {selectedAccident.status}
                </p>

                <p>
                  <strong>
                    Latitude:
                  </strong>{" "}
                  {selectedAccident.latitude}
                </p>

                <p>
                  <strong>
                    Longitude:
                  </strong>{" "}
                  {selectedAccident.longitude}
                </p>

                <p>
                  <strong>
                    Accident Address:
                  </strong>{" "}
                  {selectedAccident.address ||
                    "Address not available"}
                </p>

                <p>
                  <strong>
                    Distance:
                  </strong>{" "}
                  {selectedAccident.distance !=
                  null
                    ? `${Number(
                        selectedAccident.distance
                      ).toFixed(2)} km`
                    : "Not available"}
                </p>

                <p>
                  <strong>
                    Assigned Hospital:
                  </strong>{" "}
                  {getHospitalName(
                    selectedAccident
                  )}
                </p>

                <p>
                  <strong>
                    Time:
                  </strong>{" "}
                  {selectedAccident.timestamp
                    ? new Date(
                        selectedAccident.timestamp
                      ).toLocaleString()
                    : "N/A"}
                </p>

                {/* Sensor Information */}

                <hr />

                <h3>
                  📊 Sensor Information
                </h3>

                <p>
                  <strong>
                    Accelerometer X:
                  </strong>{" "}
                  {selectedAccident.accelerometerX ??
                    0}
                </p>

                <p>
                  <strong>
                    Accelerometer Y:
                  </strong>{" "}
                  {selectedAccident.accelerometerY ??
                    0}
                </p>

                <p>
                  <strong>
                    Accelerometer Z:
                  </strong>{" "}
                  {selectedAccident.accelerometerZ ??
                    0}
                </p>

                <p>
                  <strong>
                    Acceleration Delta:
                  </strong>{" "}
                  {selectedAccident.accelerationDelta ??
                    0}
                </p>

                <p>
                  <strong>
                    Vibration Detected:
                  </strong>{" "}
                  {selectedAccident.vibrationDetected
                    ? "Yes"
                    : "No"}
                </p>

                {/* Buttons */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "25px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() =>
                      viewPersonDetails(
                        selectedAccident
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      background:
                        "#7c3aed",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    👤 Person Details
                  </button>

                  <button
                    onClick={() =>
                      navigateToAccident(
                        selectedAccident
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      background:
                        "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🧭 Navigate
                  </button>

                  <button
                    onClick={() =>
                      handleResolve(
                        selectedAccident
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      background:
                        "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Resolve
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveAccidents;