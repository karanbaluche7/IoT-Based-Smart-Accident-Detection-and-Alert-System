import { useEffect, useState } from "react";
import { getDistance } from "geolib";
import { getProfile } from "../services/hospitalService";

function AccidentTable({ accidents }) {
  const [hospital, setHospital] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHospital();
  }, []);

  const loadHospital = async () => {
    try {
      const res = await getProfile();
      setHospital(res.data.hospital);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredAccidents = accidents.filter((item) => {
    return (
      item.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
      item.severity?.toLowerCase().includes(search.toLowerCase()) ||
      item.status?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginTop: "20px",
      }}
    >
      <h2>Live Accident Records</h2>

      {/* Search Bar */}

      <input
        type="text"
        placeholder="🔍 Search by Device ID, Severity or Status..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          margin: "15px 0",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "16px",
          outline: "none",
        }}
      />

      <div
        style={{
          overflowX: "auto",
        }}
      >
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
                color: "#fff",
              }}
            >
              <th style={thStyle}>#</th>
              <th style={thStyle}>Device ID</th>
              <th style={thStyle}>Severity</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Distance</th>
              <th style={thStyle}>Time</th>
            </tr>
          </thead>

          <tbody>
            {filteredAccidents.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No Accident Found
                </td>
              </tr>
            ) : (
              filteredAccidents.map((item, index) => {
                let distance = "-";

                if (hospital) {
                  distance = (
                    getDistance(
                      {
                        latitude: Number(hospital.latitude),
                        longitude: Number(hospital.longitude),
                      },
                      {
                        latitude: Number(item.latitude),
                        longitude: Number(item.longitude),
                      }
                    ) / 1000
                  ).toFixed(2);
                }

                return (
                  <tr key={item._id}>
                    <td style={tdStyle}>{index + 1}</td>

                    <td style={tdStyle}>{item.deviceId}</td>

                    <td style={tdStyle}>{item.severity}</td>

                    <td
                      style={{
                        ...tdStyle,
                        color:
                          item.status === "Active"
                            ? "red"
                            : "green",
                        fontWeight: "bold",
                      }}
                    >
                      {item.status}
                    </td>

                    <td style={tdStyle}>
                      {distance === "-" ? "-" : `${distance} km`}
                    </td>

                    <td style={tdStyle}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  border: "1px solid #ddd",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
};

export default AccidentTable;