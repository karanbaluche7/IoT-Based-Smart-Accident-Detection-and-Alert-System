import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getAllAccidents } from "../services/accidentService";

function History() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAccidents();
  }, []);

  const loadAccidents = async () => {
    try {
      const response = await getAllAccidents();

      setAccidents(
        response.data.accidents || []
      );
    } catch (error) {
      console.error(
        "History Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // OPEN COMPLETE ACCIDENT DETAILS
  // ======================================

  const viewMoreDetails = (accident) => {
    if (!accident?._id) {
      alert("Accident information is not available.");
      return;
    }

    navigate(
      `/accident-details/${accident._id}`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
      }}
    >
      <Sidebar />

      <div
        style={{
          marginLeft: "220px",
        }}
      >
        <Navbar />

        <div
          style={{
            padding: "30px",
          }}
        >
          <h1>📜 Accident History</h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "5px",
            }}
          >
            View previous accident records and
            complete accident information.
          </p>

          <div
            style={{
              background: "white",
              marginTop: "25px",
              padding: "20px",
              borderRadius: "10px",
              overflowX: "auto",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.08)",
            }}
          >
            {loading ? (
              <p>Loading accident history...</p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#2563eb",
                      color: "white",
                    }}
                  >
                    <th style={cellStyle}>
                      #
                    </th>

                    <th style={cellStyle}>
                      Device ID
                    </th>

                    <th style={cellStyle}>
                      Person Name
                    </th>

                    <th style={cellStyle}>
                      Vehicle Number
                    </th>

                    <th style={cellStyle}>
                      Severity
                    </th>

                    <th style={cellStyle}>
                      Accident Type
                    </th>

                    <th style={cellStyle}>
                      Status
                    </th>

                    <th style={cellStyle}>
                      Distance
                    </th>

                    <th style={cellStyle}>
                      Time
                    </th>

                    <th style={cellStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accidents.map(
                    (accident, index) => (
                      <tr
                        key={
                          accident._id
                        }
                      >
                        <td style={cellStyle}>
                          {index + 1}
                        </td>

                        <td style={cellStyle}>
                          {accident.deviceId ||
                            "N/A"}
                        </td>

                        <td style={cellStyle}>
                          {accident.personName ||
                            "Not Available"}
                        </td>

                        <td style={cellStyle}>
                          {accident.vehicleNumber ||
                            "Not Available"}
                        </td>

                        <td style={cellStyle}>
                          <span
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                accident.severity ===
                                "High"
                                  ? "#dc2626"
                                  : accident.severity ===
                                    "Medium"
                                  ? "#d97706"
                                  : "#16a34a",
                            }}
                          >
                            {accident.severity ||
                              "N/A"}
                          </span>
                        </td>

                        <td style={cellStyle}>
                          {accident.accidentType ||
                            "Unknown"}
                        </td>

                        <td style={cellStyle}>
                          {accident.status ||
                            "N/A"}
                        </td>

                        <td style={cellStyle}>
                          {accident.distance !=
                          null
                            ? `${accident.distance} km`
                            : "N/A"}
                        </td>

                        <td style={cellStyle}>
                          {accident.timestamp
                            ? new Date(
                                accident.timestamp
                              ).toLocaleString()
                            : "N/A"}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          <button
                            onClick={() =>
                              viewMoreDetails(
                                accident
                              )
                            }
                            style={{
                              padding:
                                "8px 14px",
                              background:
                                "#2563eb",
                              color: "white",
                              border: "none",
                              borderRadius:
                                "6px",
                              cursor:
                                "pointer",
                              fontWeight:
                                "600",
                            }}
                          >
                            🔍 More Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}

            {!loading &&
              accidents.length === 0 && (
                <p
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#64748b",
                  }}
                >
                  No accident records found.
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "12px",
  border: "1px solid #ddd",
  textAlign: "center",
};

export default History;