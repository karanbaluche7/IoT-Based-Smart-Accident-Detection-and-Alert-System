import { useMemo, useState, useEffect, useRef } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Siren,
  Activity,
  Navigation,
  Ambulance,
  User,
  Car,
  Cpu,
  Gauge,
  Satellite,
  Vibrate,
  Phone,
  Building2,
  Wifi,
  Database,
  Target,
  MousePointerClick,
  ClipboardCheck,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AccidentMap from "../components/AccidentMap";

import useRealtimeAccidents from "../hooks/useRealtimeAccidents";

import { getProfile } from "../services/hospitalService";

import {
  updateAccidentStatus,
  sendToNearbyHospital,
} from "../services/accidentService";

import { toast } from "react-toastify";

import "./Dashboard.css";


function Dashboard() {

  // =====================================================
  // REAL-TIME ACCIDENT DATA
  // =====================================================

  const {
    accidents,
    loading,
    connected,
    lastUpdated,
    refresh,
  } = useRealtimeAccidents();


  // =====================================================
  // STATE
  // =====================================================

  const [hospital, setHospital] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const [forwardingAccidentId, setForwardingAccidentId] =
    useState(null);

  // Prevent double clicking Accept / Resolve
  const [processingAccidentId, setProcessingAccidentId] =
    useState(null);

  const autoRefreshingRef = useRef(false);


  // =====================================================
  // LOAD HOSPITAL PROFILE
  // =====================================================

  useEffect(() => {

    const loadProfile = async () => {

      try {

        const response = await getProfile();

        setHospital(
          response.data?.hospital || null
        );

      } catch (error) {

        console.error(
          "Hospital profile error:",
          error
        );

      }

    };

    loadProfile();

  }, []);


  // =====================================================
  // AUTO REFRESH EVERY 5 SECONDS
  // =====================================================

  useEffect(() => {

    let mounted = true;

    const autoRefresh = async () => {

      if (
        autoRefreshingRef.current ||
        !mounted
      ) {
        return;
      }

      autoRefreshingRef.current = true;

      try {

        await refresh();

      } catch (error) {

        console.error(
          "Automatic refresh error:",
          error
        );

      } finally {

        autoRefreshingRef.current = false;

      }

    };

    const intervalId = setInterval(
      autoRefresh,
      5000
    );

    return () => {

      mounted = false;

      clearInterval(intervalId);

    };

  }, [refresh]);


  // =====================================================
  // ACTIVE ACCIDENTS
  // =====================================================

  const activeAccidents = useMemo(
    () =>
      accidents.filter(
        (accident) =>
          accident.status === "Active"
      ),
    [accidents]
  );


  // =====================================================
  // ACTIVE + ACCEPTED ACCIDENTS
  //
  // IMPORTANT:
  // Accepted cases must remain visible so that the
  // hospital can handle the patient and press Resolve.
  // =====================================================

  const handlingAccidents = useMemo(
    () =>
      accidents.filter(
        (accident) =>
          accident.status === "Active" ||
          accident.status === "Accepted"
      ),
    [accidents]
  );


  // =====================================================
  // CRITICAL ACCIDENTS
  // =====================================================

  const criticalAccidents = useMemo(
    () =>
      accidents.filter(
        (accident) =>
          accident.severity === "High" &&
          accident.status !== "Resolved"
      ),
    [accidents]
  );


  // =====================================================
  // RESOLVED ACCIDENTS
  // =====================================================

  const resolvedAccidents = useMemo(
    () =>
      accidents.filter(
        (accident) =>
          accident.status === "Resolved"
      ),
    [accidents]
  );


  // =====================================================
  // ACCEPTED ACCIDENTS
  // =====================================================

  const acceptedAccidents = useMemo(
    () =>
      accidents.filter(
        (accident) =>
          accident.status === "Accepted"
      ),
    [accidents]
  );


  // =====================================================
  // TODAY'S ACCIDENTS
  // =====================================================

  const todayAccidents = useMemo(() => {

    const today =
      new Date().toDateString();

    return accidents.filter(
      (accident) =>
        accident.timestamp &&
        new Date(
          accident.timestamp
        ).toDateString() === today
    );

  }, [accidents]);


  // =====================================================
  // SYSTEM METRICS
  // =====================================================

  const systemMetrics = useMemo(() => {

    const devices = new Set(
      accidents
        .map(
          (accident) =>
            accident.deviceId
        )
        .filter(Boolean)
    );


    // -----------------------------------------------------
    // GPS RECORDS
    // -----------------------------------------------------

    const gpsRecords =
      accidents.filter(
        (accident) =>
          accident.latitude !== null &&
          accident.latitude !== undefined &&
          accident.longitude !== null &&
          accident.longitude !== undefined
      );


    // -----------------------------------------------------
    // SENSOR RECORDS
    // -----------------------------------------------------

    const sensorRecords =
      accidents.filter(
        (accident) =>
          (
            accident.accelerometerX !== null &&
            accident.accelerometerX !== undefined
          ) ||
          (
            accident.accelerometerY !== null &&
            accident.accelerometerY !== undefined
          ) ||
          (
            accident.accelerometerZ !== null &&
            accident.accelerometerZ !== undefined
          ) ||
          (
            accident.accelerationDelta !== null &&
            accident.accelerationDelta !== undefined
          )
      );


    // -----------------------------------------------------
    // VIBRATION RECORDS
    // -----------------------------------------------------

    const vibrationRecords =
      accidents.filter(
        (accident) =>
          accident.vibrationDetected === true ||
          accident.vibrationDetected === "true"
      );


    // -----------------------------------------------------
    // SEVERITY
    // -----------------------------------------------------

    const highSeverity =
      accidents.filter(
        (accident) =>
          accident.severity === "High"
      );

    const mediumSeverity =
      accidents.filter(
        (accident) =>
          accident.severity === "Medium"
      );

    const lowSeverity =
      accidents.filter(
        (accident) =>
          accident.severity === "Low"
      );

    // -----------------------------------------------------
    // ACCURACY
    // -----------------------------------------------------

    const accuracyValues =
      accidents
        .map(
          (accident) =>
            getDetectionAccuracy(accident)
        )
        .filter(
          (value) =>
            value !== null &&
            !Number.isNaN(value)
        );


    const averageAccuracy =
      accuracyValues.length > 0
        ? (
            accuracyValues.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
            accuracyValues.length
          ).toFixed(1)
        : null;


    return {

      totalRecords:
        accidents.length,

      totalDevices:
        devices.size,

      gpsRecords:
        gpsRecords.length,

      sensorRecords:
        sensorRecords.length,

      vibrationRecords:
        vibrationRecords.length,

      highSeverity:
        highSeverity.length,

      mediumSeverity:
        mediumSeverity.length,

      lowSeverity:
        lowSeverity.length,

      accuracyRecords:
        accuracyValues.length,

      averageAccuracy,

    };

  }, [accidents]);


  // =====================================================
  // MANUAL REFRESH
  // =====================================================

  const handleRefresh = async () => {

    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {

      await refresh();

      toast.success(
        "Dashboard refreshed"
      );

    } catch (error) {

      console.error(
        "Manual refresh error:",
        error
      );

      toast.error(
        "Unable to refresh dashboard"
      );

    } finally {

      setRefreshing(false);

    }

  };


  // =====================================================
  // ACCEPT EMERGENCY
  // =====================================================

  const handleAccept = async (accident) => {

    if (
      accident.status !== "Active"
    ) {

      toast.warning(
        "This emergency is no longer active."
      );

      return;

    }


    if (
      processingAccidentId ===
      accident._id
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        "Accept this emergency?\n\n" +
        "After accepting, check/take the patient's details. " +
        "The case will remain visible until you resolve it."
      );


    if (!confirmed) {
      return;
    }


    try {

      setProcessingAccidentId(
        accident._id
      );


      await updateAccidentStatus(
        accident._id,
        "Accepted"
      );


      toast.success(
        "Emergency accepted. Patient details can now be handled."
      );


      // Get the latest backend status.
      await refresh();


    } catch (error) {

      console.error(
        "Accept accident error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        "Unable to accept emergency"
      );


    } finally {

      setProcessingAccidentId(
        null
      );

    }

  };


  // =====================================================
  // RESOLVE ACCIDENT
  // =====================================================

  const handleResolve = async (accident) => {

    // Resolve is allowed ONLY after Accepted.
    if (
      accident.status !== "Accepted"
    ) {

      toast.warning(
        "Accept the emergency first, then take/check the patient details before resolving."
      );

      return;

    }


    if (
      processingAccidentId ===
      accident._id
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        "Patient details have been taken/checked and the case has been handled.\n\n" +
        "Do you want to mark this accident as Resolved?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setProcessingAccidentId(
        accident._id
      );


      await updateAccidentStatus(
        accident._id,
        "Resolved"
      );


      toast.success(
        "Accident resolved successfully."
      );


      // Refresh after backend update.
      await refresh();


    } catch (error) {

      console.error(
        "Resolve accident error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        "Unable to resolve accident"
      );


    } finally {

      setProcessingAccidentId(
        null
      );

    }

  };


  // =====================================================
  // SEND TO NEARBY HOSPITAL
  // =====================================================

  const handleSendToNearbyHospital =
    async (accident) => {

      if (
        forwardingAccidentId ===
        accident._id
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          "No ambulance is available at this hospital.\n\n" +
          "Do you want to send this accident to another nearby hospital?"
        );


      if (!confirmed) {
        return;
      }


      try {

        setForwardingAccidentId(
          accident._id
        );


        toast.info(
          "Finding another nearby hospital..."
        );


        const response =
          await sendToNearbyHospital(
            accident._id
          );


        const newHospital =
          response.data?.hospital;


        if (newHospital) {

          toast.success(
            `Accident forwarded to ${newHospital.hospitalName}.`
          );

        } else {

          toast.success(
            response.data?.message ||
            "Accident forwarded successfully."
          );

        }


        await refresh();


      } catch (error) {

        console.error(
          "Send to nearby hospital error:",
          error
        );


        toast.error(
          error.response?.data?.message ||
          "Unable to find another nearby hospital."
        );


      } finally {

        setForwardingAccidentId(
          null
        );

      }

    };


  // =====================================================
  // GOOGLE MAPS NAVIGATION
  // =====================================================

  const navigateToAccident =
    (accident) => {

      if (
        accident.latitude == null ||
        accident.longitude == null
      ) {

        toast.error(
          "Accident location unavailable."
        );

        return;

      }


      let url =
        "https://www.google.com/maps/dir/?api=1";


      if (
        hospital &&
        hospital.latitude != null &&
        hospital.longitude != null
      ) {

        url +=
          `&origin=${hospital.latitude},${hospital.longitude}`;

      }


      url +=
        `&destination=${accident.latitude},${accident.longitude}`;


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="production-layout">

      <Sidebar />

      <main className="production-main">

        <Navbar />

        <div className="production-content">


          {/* =================================================
              HEADER
          ================================================= */}

          <section className="page-header">

            <div>

              <div className="eyebrow">
                EMERGENCY OPERATIONS
              </div>

              <h1>
                {hospital?.hospitalName ||
                  "Hospital Dashboard"}
              </h1>

              <p>
                Real-time accident detection and
                emergency response monitoring.
              </p>

            </div>


            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

          </section>


          {/* =================================================
              SYSTEM STATUS
          ================================================= */}

          <section
            className={`system-banner ${
              connected
                ? "online"
                : "offline"
            }`}
          >

            <div className="system-banner-left">

              <span className="status-pulse" />

              <div>

                <strong>
                  {connected
                    ? "LIVE SYSTEM CONNECTED"
                    : "CONNECTION LOST"}
                </strong>

                <span>
                  {connected
                    ? "Receiving emergency events in real time"
                    : "Attempting to reconnect..."}
                </span>

              </div>

            </div>


            <div className="sync-info">

              Last sync:{" "}

              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "—"}

            </div>

          </section>


          {/* =================================================
              CRITICAL ALERT
          ================================================= */}

          {criticalAccidents.length > 0 && (

            <section className="critical-alert">

              <div className="critical-icon">

                <Siren size={25} />

              </div>


              <div className="critical-content">

                <strong>
                  CRITICAL EMERGENCY
                </strong>


                <span>

                  {criticalAccidents.length}{" "}
                  high-severity accident
                  {criticalAccidents.length > 1
                    ? "s"
                    : ""}{" "}
                  require immediate attention.

                </span>

              </div>


              <button
                onClick={() =>
                  document
                    .getElementById(
                      "active-emergencies"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >

                View Emergencies

              </button>

            </section>

          )}


          {/* =================================================
              MAIN STATISTICS
          ================================================= */}

          <section className="stats-grid">

            <StatCard
              icon={<Siren size={22} />}
              title="Active Emergencies"
              value={
                activeAccidents.length
              }
              subtitle="Requires attention"
              type="danger"
            />


            <StatCard
              icon={
                <AlertTriangle size={22} />
              }
              title="Critical Cases"
              value={
                criticalAccidents.length
              }
              subtitle="High severity"
              type="warning"
            />


            <StatCard
              icon={<Activity size={22} />}
              title="Today's Accidents"
              value={
                todayAccidents.length
              }
              subtitle="All detected cases"
              type="primary"
            />


            <StatCard
              icon={
                <CheckCircle2 size={22} />
              }
              title="Resolved"
              value={
                resolvedAccidents.length
              }
              subtitle="Completed cases"
              type="success"
            />


            <StatCard
              icon={
                <ClipboardCheck size={22} />
              }
              title="Accepted"
              value={
                acceptedAccidents.length
              }
              subtitle="Cases being handled"
              type="primary"
            />

          </section>


          {/* =================================================
              SYSTEM METRICS
          ================================================= */}

          <section className="dashboard-panel">

            <div className="panel-header">

              <div>

                <h2>

                  <Activity size={19} />

                  System Metrics

                </h2>

                <p>
                  IoT devices, sensors and
                  emergency monitoring statistics
                </p>

              </div>


              <span className="live-badge">

                <span />

                SYSTEM

              </span>

            </div>


            <div className="metrics-grid">

              <MetricCard
                icon={
                  <Database size={20} />
                }
                title="Total Records"
                value={
                  systemMetrics.totalRecords
                }
                subtitle="Accident records"
              />


              <MetricCard
                icon={<Cpu size={20} />}
                title="ESP32 Devices"
                value={
                  systemMetrics.totalDevices
                }
                subtitle="Unique devices"
              />


              <MetricCard
                icon={<Wifi size={20} />}
                title="System Connection"
                value={
                  connected
                    ? "ONLINE"
                    : "OFFLINE"
                }
                subtitle="Backend connection"
                online={connected}
              />


              <MetricCard
                icon={
                  <Satellite size={20} />
                }
                title="GPS Records"
                value={
                  systemMetrics.gpsRecords
                }
                subtitle="Valid GPS data"
              />


              <MetricCard
                icon={<Gauge size={20} />}
                title="Sensor Records"
                value={
                  systemMetrics.sensorRecords
                }
                subtitle="Telemetry available"
              />


              <MetricCard
                icon={
                  <Vibrate size={20} />
                }
                title="Vibration Events"
                value={
                  systemMetrics.vibrationRecords
                }
                subtitle="SW-420 detected"
              />


              <MetricCard
                icon={
                  <AlertTriangle size={20} />
                }
                title="High Severity"
                value={
                  systemMetrics.highSeverity
                }
                subtitle="Critical records"
              />
              <MetricCard
                icon={
                  <Target size={20} />
                }
                title="Detection Accuracy"
                value={
                  systemMetrics.averageAccuracy !== null
                    ? `${systemMetrics.averageAccuracy}%`
                    : "N/A"
                }
                subtitle={
                  systemMetrics.accuracyRecords > 0
                    ? `${systemMetrics.accuracyRecords} accuracy records`
                    : "Backend accuracy data required"
                }
              />

            </div>

          </section>


          {/* =================================================
              LIVE MAP
          ================================================= */}

          <section
            className="dashboard-panel map-panel"
          >

            <div className="panel-header">

              <div>

                <h2>

                  <MapPin size={19} />

                  Live Emergency Map

                </h2>

                <p>
                  Accident and hospital locations
                </p>

              </div>


              <span className="live-badge">

                <span />

                LIVE

              </span>

            </div>


            <div className="production-map">

              <AccidentMap
                accidents={accidents}
              />

            </div>

          </section>


          {/* =================================================
              ACTIVE + ACCEPTED EMERGENCIES
          ================================================= */}

          <section
            className="dashboard-panel"
            id="active-emergencies"
          >

            <div className="panel-header">

              <div>

                <h2>

                  <Siren size={19} />

                  Emergency Cases

                </h2>

                <p>
                  Active emergencies and accepted
                  cases being handled by the hospital
                </p>

              </div>


              <span className="count-badge">

                {handlingAccidents.length}

              </span>

            </div>


            {loading ? (

              <LoadingState />

            ) : handlingAccidents.length === 0 ? (

              <EmptyState />

            ) : (

              <div className="emergency-list">

                {handlingAccidents.map(
                  (accident) => (

                    <EmergencyCard
                      key={
                        accident._id
                      }

                      accident={
                        accident
                      }

                      onAccept={
                        handleAccept
                      }

                      onResolve={
                        handleResolve
                      }

                      onNavigate={
                        navigateToAccident
                      }

                      onSendToNearbyHospital={
                        handleSendToNearbyHospital
                      }

                      forwarding={
                        forwardingAccidentId ===
                        accident._id
                      }

                      processing={
                        processingAccidentId ===
                        accident._id
                      }

                    />

                  )
                )}

              </div>

            )}

          </section>


          {/* =================================================
              RECENT CASES
          ================================================= */}

          <section className="dashboard-panel">

            <div className="panel-header">

              <div>

                <h2>

                  <Clock3 size={19} />

                  Recent Accident Records

                </h2>

                <p>
                  Latest events received by the system
                </p>

              </div>

            </div>


            <div className="table-wrapper">

              <table className="production-table">

                <thead>

                  <tr>

                    <th>Time</th>
                    <th>Device</th>
                    <th>Person</th>
                    <th>Vehicle</th>
                    <th>Severity</th>
                    <th>Type</th>
                    <th>Sensor</th>
                    <th>Push Button</th>
                    <th>Accuracy</th>
                    <th>Distance</th>
                    <th>Status</th>

                  </tr>

                </thead>


                <tbody>

                  {accidents
                    .slice(0, 10)
                    .map(
                      (accident) => {

                        const vibration =
                          accident.vibrationDetected ===
                            true ||
                          accident.vibrationDetected ===
                            "true";


                        const pushButtonCount =
                          getPushButtonPressCount(
                            accident
                          );


                        const accuracy =
                          getDetectionAccuracy(
                            accident
                          );


                        return (

                          <tr
                            key={
                              accident._id
                            }
                          >

                            <td>

                              {accident.timestamp
                                ? new Date(
                                    accident.timestamp
                                  ).toLocaleString()
                                : "N/A"}

                            </td>


                            <td>

                              <strong>

                                {accident.deviceId ||
                                  "Unknown"}

                              </strong>

                            </td>


                            <td>

                              {accident.personName ||
                                "Unknown"}

                            </td>


                            <td>

                              {accident.vehicleNumber ||
                                "N/A"}

                            </td>


                            <td>

                              <SeverityBadge
                                severity={
                                  accident.severity
                                }
                              />

                            </td>


                            <td>

                              {accident.accidentType ||
                                "Accident"}

                            </td>


                            <td>

                              <span
                                className={
                                  vibration
                                    ? "sensor-status detected"
                                    : "sensor-status normal"
                                }
                              >

                                <Vibrate
                                  size={12}
                                />

                                {vibration
                                  ? "Detected"
                                  : "Normal"}

                              </span>

                            </td>


                            <td>

                              <span className="button-count-badge">

                                <MousePointerClick
                                  size={12}
                                />

                                {pushButtonCount}

                              </span>

                            </td>


                            <td>

                              <span
                                className={
                                  accuracy !== null
                                    ? "accuracy-badge"
                                    : "accuracy-badge unavailable"
                                }
                              >

                                <Target
                                  size={12}
                                />

                                {accuracy !== null
                                  ? `${accuracy}%`
                                  : "N/A"}

                              </span>

                            </td>


                            <td>

                              {accident.distance !=
                              null
                                ? `${accident.distance} km`
                                : "—"}

                            </td>


                            <td>

                              <StatusBadge
                                status={
                                  accident.status
                                }
                              />

                            </td>

                          </tr>

                        );

                      }
                    )}

                </tbody>

              </table>

            </div>

          </section>


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="production-footer">

            <span>
              Smart Accident Detection & Alert System
            </span>


            <span>

              <ShieldCheck size={14} />

              Secure hospital dashboard

            </span>

          </footer>

        </div>

      </main>

    </div>

  );

}


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon,
  title,
  value,
  subtitle,
  type,
}) {

  return (

    <article
      className={`stat-card ${type}`}
    >

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-title">
        {title}
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-subtitle">
        {subtitle}
      </div>

    </article>

  );

}


// =====================================================
// SYSTEM METRIC CARD
// =====================================================

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  online,
}) {

  return (

    <div className="metric-card">

      <div className="metric-card-top">

        <div className="metric-icon">
          {icon}
        </div>


        {online !== undefined && (

          <span
            className={
              online
                ? "connection-dot online"
                : "connection-dot offline"
            }
          />

        )}

      </div>


      <div className="metric-title">
        {title}
      </div>


      <div className="metric-value">
        {value}
      </div>


      <div className="metric-subtitle">
        {subtitle}
      </div>

    </div>

  );

}


// =====================================================
// EMERGENCY CARD
// =====================================================

function EmergencyCard({
  accident,
  onAccept,
  onResolve,
  onNavigate,
  onSendToNearbyHospital,
  forwarding,
  processing,
}) {

  const assignedHospital =
    accident.assignedHospital;


  const vibrationDetected =
    accident.vibrationDetected === true ||
    accident.vibrationDetected === "true";


  const pushButtonCount =
    getPushButtonPressCount(
      accident
    );


  const detectionAccuracy =
    getDetectionAccuracy(
      accident
    );


  const isActive =
    accident.status === "Active";


  const isAccepted =
    accident.status === "Accepted";


  return (

    <article
      className={`emergency-card ${
        accident.severity === "High"
          ? "critical"
          : ""
      } ${
        isAccepted
          ? "accepted-case"
          : ""
      }`}
    >

      <div className="emergency-main">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="emergency-severity">

          <SeverityBadge
            severity={
              accident.severity
            }
          />


          <span className="emergency-status">

            {isAccepted
              ? "ACCEPTED"
              : "ACTIVE"}

          </span>

        </div>


        <h3>

          {accident.accidentType ||
            "Vehicle Accident"}

        </h3>


        <div className="emergency-meta">

          <span>

            <Clock3 size={15} />

            {accident.timestamp
              ? new Date(
                  accident.timestamp
                ).toLocaleString()
              : "N/A"}

          </span>


          <span>

            <MapPin size={15} />

            {accident.latitude != null &&
            accident.longitude != null

              ? `${Number(
                  accident.latitude
                ).toFixed(5)}, ${Number(
                  accident.longitude
                ).toFixed(5)}`

              : "Location unavailable"}

          </span>


          <span>

            <Navigation size={15} />

            {accident.distance != null
              ? `${accident.distance} km away`
              : "Distance unavailable"}

          </span>

        </div>


        {/* =================================================
            DETECTION SUMMARY
        ================================================= */}

       

        {/* =================================================
            WORKFLOW MESSAGE
        ================================================= */}

        {isActive && (

          <div className="active-workflow-note">

            <AlertTriangle size={17} />

            <div>

              <strong>
                Action Required
              </strong>

              <span>

               Accept this emergency first. After accepting, review the patient's details and accident location. If an ambulance is unavailable, click “Send to Nearby Hospital” to forward the emergency to another active hospital. Mark the emergency as resolved only after the response has been recorded.

              </span>

            </div>

          </div>

        )}


        {isAccepted && (

          <div className="accepted-workflow-note">

            <ClipboardCheck size={17} />

            <div>

              <strong>
                Emergency Accepted
              </strong>

              <span>

                Patient details can now be
                checked and handled. Resolve
                the case after handling the
                patient.

              </span>

            </div>

          </div>

        )}


        {/* =================================================
            PERSONAL DETAILS
        ================================================= */}

        <DashboardSection
          icon={<User size={18} />}
          title="Personal Details"
        >

          <DetailGrid>

            <InfoItem
              label="Full Name"
              value={
                accident.personName ||
                "Not available"
              }
            />


            <InfoItem
              label="Date of Birth"
              value={
                accident.dateOfBirth
                  ? new Date(
                      accident.dateOfBirth
                    ).toLocaleDateString()
                  : "Not available"
              }
            />


            <InfoItem
              label="Gender"
              value={
                accident.gender ||
                "Not available"
              }
            />


            <InfoItem
              label="Blood Group"
              value={
                accident.bloodGroup ||
                "Not available"
              }
            />


            <InfoItem
              label="Phone Number"
              value={
                accident.phoneNumber ||
                "Not available"
              }
              icon={
                <Phone size={14} />
              }
            />


            <InfoItem
              label="Parent / Emergency Contact"
              value={
                accident.parentPhoneNumber ||
                "Not available"
              }
              icon={
                <Phone size={14} />
              }
            />


            <InfoItem
              label="Person Address"
              value={
                accident.personAddress ||
                "Not available"
              }
              full
            />

          </DetailGrid>

        </DashboardSection>


        {/* =================================================
            VEHICLE & DEVICE
        ================================================= */}

        <DashboardSection
          icon={<Car size={18} />}
          title="Vehicle & Device Details"
        >

          <DetailGrid>

            <InfoItem
              label="Vehicle Number"
              value={
                accident.vehicleNumber ||
                "Not available"
              }
            />


            <InfoItem
              label="ESP32 Device ID"
              value={
                accident.deviceId ||
                "Not available"
              }
              icon={
                <Cpu size={14} />
              }
            />

          </DetailGrid>

        </DashboardSection>


        {/* =================================================
            HARDWARE & SENSOR DETAILS
        ================================================= */}

        <DashboardSection
          icon={<Activity size={18} />}
          title="Hardware & Sensor Details"
        >


          <SensorGroup
            title="ESP32 Controller"
          >

            <SensorGrid>

              <SensorBox
                label="Device ID"
                value={
                  accident.deviceId ||
                  "N/A"
                }
              />


              <SensorBox
                label="Controller"
                value="ESP32 DevKit V1"
              />


              <SensorBox
                label="Communication"
                value="Wi-Fi"
              />

            </SensorGrid>

          </SensorGroup>


          <SensorGroup
            title="ADXL335 Accelerometer"
          >

            <SensorGrid>

              <SensorBox
                label="X Axis"
                value={formatValue(
                  accident.accelerometerX
                )}
              />


              <SensorBox
                label="Y Axis"
                value={formatValue(
                  accident.accelerometerY
                )}
              />


              <SensorBox
                label="Z Axis"
                value={formatValue(
                  accident.accelerometerZ
                )}
              />


              <SensorBox
                label="Acceleration Delta"
                value={formatValue(
                  accident.accelerationDelta
                )}
                highlight
              />

            </SensorGrid>

          </SensorGroup>


          <SensorGroup
            title="SW-420 Vibration Sensor"
          >

            <div
              className={
                vibrationDetected
                  ? "vibration-box detected"
                  : "vibration-box normal"
              }
            >

              <div className="vibration-label">

                <Vibrate size={17} />

                <strong>
                  Vibration Status
                </strong>

              </div>


              <span
                className={
                  vibrationDetected
                    ? "vibration-badge detected"
                    : "vibration-badge normal"
                }
              >

                {vibrationDetected
                  ? "DETECTED"
                  : "NOT DETECTED"}

              </span>

            </div>

          </SensorGroup>


          <SensorGroup
            title="NEO-6M GPS"
          >

            <SensorGrid>

              <SensorBox
                label="Latitude"
                value={
                  accident.latitude != null
                    ? Number(
                        accident.latitude
                      ).toFixed(6)
                    : "N/A"
                }
              />


              <SensorBox
                label="Longitude"
                value={
                  accident.longitude != null
                    ? Number(
                        accident.longitude
                      ).toFixed(6)
                    : "N/A"
                }
              />


              <SensorBox
                label="Location Address"
                value={
                  accident.address ||
                  "Address unavailable"
                }
                wide
              />

            </SensorGrid>

          </SensorGroup>


          <SensorGroup
            title="Emergency Push Button"
          >

            <SensorGrid>

              <SensorBox
                label="Button Press Count"
                value={
                  pushButtonCount
                }
                highlight
              />


              <SensorBox
                label="Button Status"
                value={
                  pushButtonCount > 0
                    ? "Pressed"
                    : "Not Pressed"
                }
              />

            </SensorGrid>

          </SensorGroup>


          <SensorGroup
            title="Accident Detection Accuracy"
          >

            <SensorGrid>

              <SensorBox
                label="Detection Accuracy"
                value={
                  detectionAccuracy !== null
                    ? `${detectionAccuracy}%`
                    : "N/A"
                }
                highlight
              />


              <SensorBox
                label="Accuracy Source"
                value={
                  detectionAccuracy !== null
                    ? "Backend detection record"
                    : "No accuracy value received"
                }
              />

            </SensorGrid>

          </SensorGroup>


          <SensorGroup
            title="Detection Information"
          >

            <SensorGrid>

              <SensorBox
                label="Detection Time"
                value={
                  accident.timestamp
                    ? new Date(
                        accident.timestamp
                      ).toLocaleString()
                    : "N/A"
                }
                wide
              />

            </SensorGrid>

          </SensorGroup>

        </DashboardSection>


        {/* =================================================
            ACCIDENT INFORMATION
        ================================================= */}

        <DashboardSection
          icon={
            <AlertTriangle size={18} />
          }
          title="Accident Information"
        >

          <DetailGrid>

            <InfoItem
              label="Accident Type"
              value={
                accident.accidentType ||
                "Not available"
              }
            />


            <InfoItem
              label="Severity"
              value={
                accident.severity ||
                "Not available"
              }
            />


            <InfoItem
              label="Status"
              value={
                accident.status ||
                "Not available"
              }
            />


            <InfoItem
              label="Acceleration Delta"
              value={formatValue(
                accident.accelerationDelta
              )}
            />


            <InfoItem
              label="Push Button Presses"
              value={
                pushButtonCount
              }
            />


            <InfoItem
              label="Detection Accuracy"
              value={
                detectionAccuracy !== null
                  ? `${detectionAccuracy}%`
                  : "N/A"
              }
            />


            <InfoItem
              label="Accident Address"
              value={
                accident.address ||
                "Address unavailable"
              }
              full
            />

          </DetailGrid>

        </DashboardSection>


        {/* =================================================
            HOSPITAL RESPONSE
        ================================================= */}

        <DashboardSection
          icon={
            <Building2 size={18} />
          }
          title="Hospital Response"
        >

          <DetailGrid>

            <InfoItem
              label="Assigned Hospital"
              value={
                assignedHospital?.hospitalName ||
                "Not available"
              }
            />


            <InfoItem
              label="Hospital Phone"
              value={
                assignedHospital?.phone ||
                assignedHospital?.phoneNumber ||
                "Not available"
              }
            />


            <InfoItem
              label="Distance"
              value={
                accident.distance != null
                  ? `${accident.distance} km`
                  : "Not available"
              }
            />


            <InfoItem
              label="Hospital Address"
              value={
                assignedHospital?.address ||
                "Not available"
              }
              full
            />

          </DetailGrid>

        </DashboardSection>


        {/* =================================================
            AMBULANCE FORWARDING
        ================================================= */}

        <div className="ambulance-forward-box">

          <div className="ambulance-title">

            <Ambulance size={18} />

            Ambulance Availability

          </div>


          <p>

            If your hospital does not have
            an ambulance available, forward
            this emergency to another nearby
            active hospital.

          </p>


          <button
            onClick={() =>
              onSendToNearbyHospital(
                accident
              )
            }
            disabled={
              forwarding ||
              processing
            }
            className={
              forwarding
                ? "forward-button disabled"
                : "forward-button"
            }
          >

            {forwarding ? (

              <>

                <RefreshCw
                  size={16}
                  className="spin"
                />

                Finding Nearby Hospital...

              </>

            ) : (

              <>

                <Ambulance
                  size={16}
                />

                No Ambulance Available —
                Send to Nearby Hospital

              </>

            )}

          </button>

        </div>

      </div>


      {/* =================================================
          ACTION BUTTONS
      ================================================= */}

      <div className="emergency-actions">


        {/* NAVIGATE */}

        <button
          className="navigate-button"
          onClick={() =>
            onNavigate(accident)
          }
          disabled={processing}
        >

          <Navigation size={16} />

          Navigate

        </button>


        {/* =================================================
            ACCEPT BUTTON
        ================================================= */}

        {isActive && (

          <button
            className="accept-button"
            onClick={() =>
              onAccept(accident)
            }
            disabled={processing}
          >

            {processing ? (

              <>

                <RefreshCw
                  size={16}
                  className="spin"
                />

                Accepting...

              </>

            ) : (

              <>

                <ClipboardCheck
                  size={16}
                />

                Accept Emergency

              </>

            )}

          </button>

        )}


        {/* =================================================
            ACCEPTED STATUS
        ================================================= */}

        {isAccepted && (

          <span className="accepted-action-badge">

            <CheckCircle2 size={16} />

            Patient Details / Emergency Accepted

          </span>

        )}


        {/* =================================================
            RESOLVE BUTTON
        ================================================= */}

        <button
          className={
            isAccepted
              ? "resolve-button"
              : "resolve-button disabled"
          }
          onClick={() =>
            onResolve(accident)
          }
          disabled={
            !isAccepted ||
            processing
          }
          title={
            !isAccepted
              ? "Accept the emergency before resolving"
              : "Resolve accident after handling patient details"
          }
        >

          {processing ? (

            <>

              <RefreshCw
                size={16}
                className="spin"
              />

              Updating...

            </>

          ) : (

            <>

              <CheckCircle2 size={16} />

              Resolve

            </>

          )}

        </button>

      </div>

    </article>

  );

}


// =====================================================
// DASHBOARD SECTION
// =====================================================

function DashboardSection({
  icon,
  title,
  children,
}) {

  return (

    <div className="dashboard-detail-section">

      <div className="dashboard-section-title">

        {icon}

        {title}

      </div>

      {children}

    </div>

  );

}


// =====================================================
// DETAIL GRID
// =====================================================

function DetailGrid({
  children,
}) {

  return (

    <div className="detail-grid">

      {children}

    </div>

  );

}


// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  label,
  value,
  icon,
  full = false,
}) {

  return (

    <div
      className={
        full
          ? "info-item full"
          : "info-item"
      }
    >

      <div className="info-label">

        {icon}

        {label}

      </div>


      <div className="info-value">

        {value}

      </div>

    </div>

  );

}


// =====================================================
// SENSOR GROUP
// =====================================================

function SensorGroup({
  title,
  children,
}) {

  return (

    <div className="sensor-group">

      <div className="sensor-group-title">

        {title}

      </div>

      {children}

    </div>

  );

}


// =====================================================
// SENSOR GRID
// =====================================================

function SensorGrid({
  children,
}) {

  return (

    <div className="sensor-grid">

      {children}

    </div>

  );

}


// =====================================================
// SENSOR BOX
// =====================================================

function SensorBox({
  label,
  value,
  highlight = false,
  wide = false,
}) {

  return (

    <div
      className={`
        sensor-box
        ${highlight ? "highlight" : ""}
        ${wide ? "wide" : ""}
      `}
    >

      <div className="sensor-box-label">

        {label}

      </div>


      <div className="sensor-box-value">

        {value}

      </div>

    </div>

  );

}


// =====================================================
// SENSOR VALUE FORMATTER
// =====================================================

function formatValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "N/A";

  }


  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return value;

  }


  return number.toFixed(3);

}


// =====================================================
// PUSH BUTTON COUNT
// =====================================================

function getPushButtonPressCount(
  accident
) {

  if (!accident) {
    return 0;
  }


  const possibleValues = [

    accident.pushButtonPressCount,

    accident.buttonPressCount,

    accident.cancelButtonPressCount,

    accident.pushButtonCount,

    accident.buttonCount,

    accident.emergencyButtonPressCount,

  ];


  for (
    const value of possibleValues
  ) {

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {

      const number =
        Number(value);


      if (
        !Number.isNaN(number)
      ) {

        return Math.max(
          0,
          number
        );

      }

    }

  }


  if (
    accident.pushButtonPressed === true ||
    accident.buttonPressed === true ||
    accident.emergencyButtonPressed === true
  ) {

    return 1;

  }


  return 0;

}


// =====================================================
// DETECTION ACCURACY
// =====================================================

function getDetectionAccuracy(accident) {
  if (!accident) {
    return null;
  }

  const possibleValues = [
    accident.detectionAccuracy,
    accident.accuracy,
    accident.accidentDetectionAccuracy,
    accident.modelAccuracy,
  ];

  for (const value of possibleValues) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    let number = Number(value);

    if (!Number.isFinite(number)) {
      continue;
    }

    // Accept either a fraction (0.95) or percentage (95).
    if (number > 0 && number <= 1) {
      number *= 100;
    }

    // Ignore values outside the valid percentage range.
    if (number < 0 || number > 100) {
      continue;
    }

    return Number(number.toFixed(1));
  }

  return null;
}

// =====================================================
// SEVERITY BADGE
// =====================================================

function SeverityBadge({
  severity,
}) {

  const value =
    severity || "Low";


  return (

    <span
      className={`severity-badge ${value.toLowerCase()}`}
    >

      {value}

    </span>

  );

}


// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}) {

  const value =
    status || "Unknown";


  return (

    <span
      className={`status-badge ${value
        .toLowerCase()
        .replace(/\s/g, "-")}`}
    >

      {value}

    </span>

  );

}


// =====================================================
// LOADING STATE
// =====================================================

function LoadingState() {

  return (

    <div className="empty-state">

      <RefreshCw
        className="spin"
        size={28}
      />

      <strong>
        Loading emergencies...
      </strong>

    </div>

  );

}


// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState() {

  return (

    <div className="empty-state">

      <CheckCircle2 size={38} />

      <strong>
        No active emergencies
      </strong>

      <span>
        The system is currently
        monitoring normally.
      </span>

    </div>

  );

}


export default Dashboard;