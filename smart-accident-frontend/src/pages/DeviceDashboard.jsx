
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/DeviceDashboard.css";

const API_URL = "http://localhost:5000/api/devices";
const ACCIDENT_API_URL = "http://localhost:5000/api/accidents";

const emptyEditForm = {
  vehicleNumber: "",
  personName: "",
  dateOfBirth: "",
  gender: "Not Available",
  bloodGroup: "",
  phoneNumber: "",
  parentPhoneNumber: "",
  personAddress: "",
};

function getEditForm(device) {
  return {
    vehicleNumber: device.vehicleNumber || "",
    personName: device.personName || "",
    dateOfBirth:
      device.dateOfBirth &&
      /^\d{4}-\d{2}-\d{2}$/.test(device.dateOfBirth)
        ? device.dateOfBirth
        : "",
    gender: device.gender || "Not Available",
    bloodGroup:
      device.bloodGroup === "Not Available"
        ? ""
        : device.bloodGroup || "",
    phoneNumber:
      device.phoneNumber === "Not Available"
        ? ""
        : device.phoneNumber || "",
    parentPhoneNumber:
      device.parentPhoneNumber === "Not Available"
        ? ""
        : device.parentPhoneNumber || "",
    personAddress:
      device.personAddress === "Not Available"
        ? ""
        : device.personAddress || "",
  };
}

function displayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "Not Available";
  }

  return value;
}

function DetailRow({ label, value }) {
  return (
    <div className="device-detail">
      <span>{label}</span>
      <strong>{displayValue(value)}</strong>
    </div>
  );
}

export default function DeviceDashboard() {
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState("");
  const [devices, setDevices] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [accidents, setAccidents] = useState([]);
  const [accidentError, setAccidentError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Use the same token key as DeviceLogin.jsx.
  async function apiRequest(url, options = {}) {
    const token = sessionStorage.getItem("providerToken");

    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          data.message || "Authentication failed. Please log in again."
        );
      }

      throw new Error(
        data.message || data.error || `Request failed (${response.status}).`
      );
    }

    return data;
  }

  // Fetch and display all registered devices.
  async function loadAllDevices() {
    setLoading(true);
    setError("");
    setMessage("");
    setShowAll(true);
    setSelectedDevice(null);
    setEditMode(false);
    setAccidents([]);
    setAccidentError("");

    try {
      const data = await apiRequest(API_URL);

      const list = Array.isArray(data.devices) ? data.devices : [];

      setDevices(list);
      setMessage(
        list.length
          ? `${list.length} registered device(s) found.`
          : "No devices have been registered yet."
      );
    } catch (err) {
      setDevices([]);
      setError(err.message || "Failed to load registered devices.");
    } finally {
      setLoading(false);
    }
  }

  // Search for a particular device by its ID.
  async function handleSearch(event) {
    event.preventDefault();

    const id = searchId.trim();

    if (!id) {
      setError("Please enter a Device ID.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setShowAll(false);
    setDevices([]);
    setSelectedDevice(null);
    setEditMode(false);
    setAccidents([]);
    setAccidentError("");

    try {
      const data = await apiRequest(
        `${API_URL}?deviceId=${encodeURIComponent(id)}`
      );

      if (!data.device) {
        throw new Error("Device not found.");
      }

      setSelectedDevice(data.device);
      setMessage("Device found successfully.");
      await loadAccidentHistory(data.device.deviceId);
    } catch (err) {
      setError(err.message || "Failed to search for device.");
    } finally {
      setLoading(false);
    }
  }

  // Select a device from the all-devices table.
  async function viewDevice(device) {
    setSelectedDevice(device);
    setSearchId(device.deviceId);
    setShowAll(false);
    setEditMode(false);
    setError("");
    setMessage("");
    setAccidents([]);
    setAccidentError("");

    await loadAccidentHistory(device.deviceId);
  }

  // Fetch accident records associated with a device.
  async function loadAccidentHistory(deviceId) {
    setAccidents([]);
    setAccidentError("");

    try {
      const data = await apiRequest(
        `${ACCIDENT_API_URL}?deviceId=${encodeURIComponent(deviceId)}`
      );

      const records = Array.isArray(data.accidents)
        ? data.accidents
        : Array.isArray(data)
          ? data
          : data.accident
            ? [data.accident]
            : [];

      setAccidents(records);
    } catch (err) {
      setAccidentError(
        err.message || "Could not load accident history."
      );
    }
  }

  function startEditing() {
    if (!selectedDevice) return;

    setEditForm(getEditForm(selectedDevice));
    setEditMode(true);
    setError("");
    setMessage("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Save edited owner and vehicle details.
  async function handleUpdate(event) {
    event.preventDefault();

    if (!selectedDevice?._id) {
      setError("The device database record ID is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...editForm,
        vehicleNumber: editForm.vehicleNumber.trim(),
        personName: editForm.personName.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        parentPhoneNumber: editForm.parentPhoneNumber.trim(),
        personAddress: editForm.personAddress.trim(),
      };

      if (!payload.vehicleNumber || !payload.personName) {
        throw new Error("Vehicle number and owner name are required.");
      }

      const data = await apiRequest(
        `${API_URL}/${selectedDevice._id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (!data.device) {
        throw new Error("The updated device was not returned.");
      }

      setSelectedDevice(data.device);
      setEditForm(getEditForm(data.device));
      setEditMode(false);
      setMessage("Device details updated successfully.");
      toast.success("Device details updated successfully.");

      if (showAll) {
        await loadAllDevices();
      }
    } catch (err) {
      setError(err.message || "Failed to update device.");
      toast.error(err.message || "Failed to update device.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("providerToken");
    sessionStorage.removeItem("providerInfo");
    navigate("/distributor-login", { replace: true });
  }

  return (
    <div className="device-dashboard">
      <main className="device-main">
        {/* Page header */}
        <header className="device-header">
          <div>
            <h1>Device Administrator Dashboard</h1>
            <p>
              Search devices, view registered vehicles and manage owner
              details.
            </p>
          </div>

          <div className="device-form-actions">
            <button
              type="button"
              className="device-btn"
              onClick={() => navigate("/device-register")}
            >
              + Register New Device
            </button>

            <button
              type="button"
              className="device-btn secondary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Search */}
        <section className="device-section">
          <h2>Search Registered Device</h2>

          <form className="device-toolbar" onSubmit={handleSearch}>
            <input
              className="device-search"
              type="text"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              placeholder="Enter Device ID (e.g. ESP32_22)"
              aria-label="Search by Device ID"
            />

            <button
              className="device-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search Device"}
            </button>

            <button
              className="device-btn secondary"
              type="button"
              onClick={loadAllDevices}
              disabled={loading}
            >
              Show All Registered Devices
            </button>
          </form>

          {error && (
            <div className="device-error" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="device-success" role="status">
              {message}
            </div>
          )}
        </section>

        {/* All registered devices */}
        {showAll && (
          <section className="device-section">
            <div className="device-header">
              <div>
                <h2>All Registered Devices</h2>
                <p>
                  Total registered devices: {devices.length}
                </p>
              </div>

              <button
                type="button"
                className="device-btn secondary"
                onClick={() => setShowAll(false)}
              >
                Hide Device List
              </button>
            </div>

            {loading ? (
              <div className="device-empty">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="device-empty">
                No registered devices found.
              </div>
            ) : (
              <div className="device-table-wrapper">
                <table className="device-table">
                  <thead>
                    <tr>
                      <th>Device ID</th>
                      <th>Vehicle Number</th>
                      <th>Owner Name</th>
                      <th>Owner Phone</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {devices.map((device) => (
                      <tr key={device._id || device.deviceId}>
                        <td>{device.deviceId}</td>
                        <td>{displayValue(device.vehicleNumber)}</td>
                        <td>{displayValue(device.personName)}</td>
                        <td>{displayValue(device.phoneNumber)}</td>
                        <td>
                          <span
                            className={`device-status ${
                              device.isActive ? "active" : "inactive"
                            }`}
                          >
                            {device.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="device-btn"
                            onClick={() => viewDevice(device)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Selected device details */}
        {selectedDevice && !editMode && (
          <section className="device-section">
            <div className="device-header">
              <div>
                <h2>Registered Device Details</h2>
                <p>Device ID: {selectedDevice.deviceId}</p>
              </div>

              <button
                type="button"
                className="device-btn"
                onClick={startEditing}
              >
                Edit Device Details
              </button>
            </div>

            <div className="device-details-grid">
              <DetailRow
                label="Device ID"
                value={selectedDevice.deviceId}
              />
              <DetailRow
                label="Vehicle Number"
                value={selectedDevice.vehicleNumber}
              />
              <DetailRow
                label="Owner Name"
                value={selectedDevice.personName}
              />
              <DetailRow
                label="Date of Birth"
                value={selectedDevice.dateOfBirth}
              />
              <DetailRow
                label="Gender"
                value={selectedDevice.gender}
              />
              <DetailRow
                label="Blood Group"
                value={selectedDevice.bloodGroup}
              />
              <DetailRow
                label="Owner Phone"
                value={selectedDevice.phoneNumber}
              />
              <DetailRow
                label="Parent / Emergency Phone"
                value={selectedDevice.parentPhoneNumber}
              />
              <DetailRow
                label="Permanent Address"
                value={selectedDevice.personAddress}
              />
              <DetailRow
                label="Registration Status"
                value={selectedDevice.isActive ? "Active" : "Inactive"}
              />
              <DetailRow
                label="Database Record ID"
                value={selectedDevice._id}
              />
              <DetailRow
                label="Registered On"
                value={
                  selectedDevice.createdAt
                    ? new Date(selectedDevice.createdAt).toLocaleString()
                    : "Not Available"
                }
              />
            </div>

            <div className="device-form-actions">
              <button
                type="button"
                className="device-btn secondary"
                onClick={() => {
                  setSelectedDevice(null);
                  setAccidents([]);
                  setMessage("");
                  setError("");
                }}
              >
                Close Details
              </button>
            </div>
          </section>
        )}

        {/* Edit device details */}
        {selectedDevice && editMode && (
          <section className="device-section">
            <h2>Edit Device &amp; Owner Details</h2>

            <p>
              Device ID: <strong>{selectedDevice.deviceId}</strong>
            </p>

            <form className="device-form" onSubmit={handleUpdate}>
              <div className="device-form-group">
                <label htmlFor="editVehicleNumber">
                  Vehicle Number *
                </label>
                <input
                  id="editVehicleNumber"
                  name="vehicleNumber"
                  value={editForm.vehicleNumber}
                  onChange={handleEditChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="editPersonName">Owner Name *</label>
                <input
                  id="editPersonName"
                  name="personName"
                  value={editForm.personName}
                  onChange={handleEditChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="editDateOfBirth">Date of Birth</label>
                <input
                  id="editDateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="editGender">Gender</label>
                <select
                  id="editGender"
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                  disabled={saving}
                >
                  <option value="Not Available">Not Available</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="device-form-group">
                <label htmlFor="editBloodGroup">Blood Group</label>
                <select
                  id="editBloodGroup"
                  name="bloodGroup"
                  value={editForm.bloodGroup}
                  onChange={handleEditChange}
                  disabled={saving}
                >
                  <option value="">Select blood group</option>
                  {[
                    "A+", "A-", "B+", "B-",
                    "AB+", "AB-", "O+", "O-",
                  ].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                  <option value="Not Available">Not Available</option>
                </select>
              </div>

              <div className="device-form-group">
                <label htmlFor="editPhoneNumber">
                  Owner Phone Number *
                </label>
                <input
                  id="editPhoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={handleEditChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="editParentPhoneNumber">
                  Parent / Emergency Phone
                </label>
                <input
                  id="editParentPhoneNumber"
                  name="parentPhoneNumber"
                  type="tel"
                  value={editForm.parentPhoneNumber}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              <div className="device-form-group full-width">
                <label htmlFor="editPersonAddress">
                  Permanent Address
                </label>
                <textarea
                  id="editPersonAddress"
                  name="personAddress"
                  value={editForm.personAddress}
                  onChange={handleEditChange}
                  disabled={saving}
                />
              </div>

              <div className="device-form-actions">
                <button
                  type="button"
                  className="device-btn secondary"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="device-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Accident history */}
        {selectedDevice && !editMode && (
          <section className="device-section">
            <h2>Accident History</h2>

            {accidentError && (
              <div className="device-error" role="alert">
                {accidentError}
              </div>
            )}

            {!accidentError && accidents.length === 0 && (
              <div className="device-empty">
                No accident records found for this device, or the
                accident API did not return any records.
              </div>
            )}

            {accidents.length > 0 && (
              <div className="device-table-wrapper">
                <table className="device-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Severity</th>
                      <th>Accident Type</th>
                      <th>Status</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                    </tr>
                  </thead>

                  <tbody>
                    {accidents.map((accident, index) => (
                      <tr
                        key={
                          accident._id ||
                          `${accident.deviceId}-${index}`
                        }
                      >
                        <td>
                          {accident.timestamp || accident.createdAt
                            ? new Date(
                                accident.timestamp ||
                                  accident.createdAt
                              ).toLocaleString()
                            : "Not Available"}
                        </td>
                        <td>{displayValue(accident.severity)}</td>
                        <td>{displayValue(accident.accidentType)}</td>
                        <td>{displayValue(accident.status)}</td>
                        <td>{displayValue(accident.latitude)}</td>
                        <td>{displayValue(accident.longitude)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}