
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/DeviceDashboard.css";

const API_URL = "http://localhost:5000/api/devices";

const initialForm = {
  deviceId: "",
  vehicleNumber: "",
  personName: "",
  dateOfBirth: "",
  gender: "Not Available",
  bloodGroup: "",
  phoneNumber: "",
  parentPhoneNumber: "",
  personAddress: "",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "12px",
};

const detailRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(130px, 180px) minmax(0, 1fr)",
  columnGap: "16px",
  rowGap: "4px",
  alignItems: "start",
  padding: "8px 0",
  borderBottom: "1px solid #e5e7eb",
};

const detailLabelStyle = {
  fontWeight: 500,
  color: "#475569",
  overflowWrap: "anywhere",
};

const detailValueStyle = {
  fontWeight: 600,
  color: "#0f172a",
  minWidth: 0,
  overflowWrap: "anywhere",
  margin: 0,
};

function DetailRow({ label, value }) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <strong style={detailValueStyle}>
        {value || "Not Available"}
      </strong>
    </div>
  );
}

export default function DeviceRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [registeredDevice, setRegisteredDevice] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");
    setRegisteredDevice(null);

    try {
      const token = sessionStorage.getItem("providerToken");

      if (!token) {
        throw new Error(
          "Authentication token missing. Please log in again."
        );
      }

      const payload = {
        ...form,
        deviceId: form.deviceId.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        personName: form.personName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        parentPhoneNumber: form.parentPhoneNumber.trim(),
        personAddress: form.personAddress.trim(),
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Registration failed (${response.status}).`
        );
      }

      if (!data.device) {
        throw new Error("The registered device was not returned.");
      }

      setRegisteredDevice(data.device);
      setMessage(data.message || "Device registered successfully.");
      setForm({ ...initialForm });

      toast.success("Device registered successfully!");
    } catch (err) {
      setError(err.message || "Device registration failed.");
      toast.error(err.message || "Device registration failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="device-dashboard">
      <main className="device-main">
        <header className="device-header">
          <div>
            <h1>Register New Device</h1>
            <p>
              Register an ESP32 device and associate it with its
              vehicle and owner.
            </p>
          </div>

          <button
            type="button"
            className="device-btn secondary"
            onClick={() => navigate("/device-dashboard")}
          >
            Back to Dashboard
          </button>
        </header>

        <section className="device-section">
          <h2>Device &amp; Vehicle Registration</h2>

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

          <form className="device-form" onSubmit={handleSubmit}>
            <div className="device-form-group">
              <label htmlFor="deviceId">Device ID *</label>
              <input
                id="deviceId"
                name="deviceId"
                value={form.deviceId}
                onChange={handleChange}
                placeholder="Example: ESP32_22"
                required
                disabled={saving}
              />
            </div>

            <div className="device-form-group">
              <label htmlFor="vehicleNumber">
                Vehicle Number *
              </label>
              <input
                id="vehicleNumber"
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleChange}
                placeholder="Example: KA01AB1234"
                required
                disabled={saving}
              />
            </div>

            <div className="device-form-group">
              <label htmlFor="personName">
                Owner / Person Name *
              </label>
              <input
                id="personName"
                name="personName"
                value={form.personName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                disabled={saving}
              />
            </div>

            <div className="device-form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="device-form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Not Available">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="device-form-group">
              <label htmlFor="bloodGroup">Blood Group</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
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
              <label htmlFor="phoneNumber">
                Owner Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Owner phone number"
                required
                disabled={saving}
              />
            </div>

            <div className="device-form-group">
              <label htmlFor="parentPhoneNumber">
                Parent / Emergency Phone
              </label>
              <input
                id="parentPhoneNumber"
                name="parentPhoneNumber"
                type="tel"
                value={form.parentPhoneNumber}
                onChange={handleChange}
                placeholder="Emergency contact"
                disabled={saving}
              />
            </div>

            <div className="device-form-group full-width">
              <label htmlFor="personAddress">
                Permanent Address
              </label>
              <textarea
                id="personAddress"
                name="personAddress"
                value={form.personAddress}
                onChange={handleChange}
                placeholder="Enter the owner's address"
                disabled={saving}
              />
            </div>

            <div className="device-form-actions">
              <button
                className="device-btn secondary"
                type="button"
                onClick={() => {
                  setForm({ ...initialForm });
                  setError("");
                  setMessage("");
                  setRegisteredDevice(null);
                }}
                disabled={saving}
              >
                Clear Form
              </button>

              <button
                className="device-btn"
                type="submit"
                disabled={saving}
              >
                {saving ? "Registering..." : "Register Device"}
              </button>
            </div>
          </form>
        </section>

        {registeredDevice && (
          <section className="device-section">
            <h2>Registered Device Details</h2>

            <div style={detailsGridStyle}>
              <DetailRow
                label="Device ID : "
                value={registeredDevice.deviceId}
              />

              <DetailRow
                label="Vehicle Number : "
                value={registeredDevice.vehicleNumber}
              />

              <DetailRow
                label="Owner Name : "
                value={registeredDevice.personName}
              />

              <DetailRow
                label="Date of Birth : "
                value={registeredDevice.dateOfBirth}
              />

              <DetailRow
                label="Gender : "
                value={registeredDevice.gender}
              />

              <DetailRow
                label="Blood Group : "
                value={registeredDevice.bloodGroup}
              />

              <DetailRow
                label="Owner Phone : "
                value={registeredDevice.phoneNumber}
              />

              <DetailRow
                label="Parent / Emergency Phone : "
                value={registeredDevice.parentPhoneNumber}
              />

              <DetailRow
                label="Permanent Address : "
                value={registeredDevice.personAddress}
              />

              <DetailRow
                label="Registration Status : "
                value={
                  registeredDevice.isActive
                    ? "Active"
                    : "Inactive"
                }
              />

              <DetailRow
                label="Database Record ID"
                value={registeredDevice._id}
              />
            </div>

            <div className="device-form-actions">
              <button
                type="button"
                className="device-btn"
                onClick={() => navigate("/device-dashboard")}
              >
                Go to Dashboard
              </button>

              <button
                type="button"
                className="device-btn secondary"
                onClick={() => {
                  setRegisteredDevice(null);
                  setMessage("");
                }}
              >
                Register Another Device
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}