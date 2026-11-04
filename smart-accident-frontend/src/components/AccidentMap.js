import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

import {
  getProfile,
  getAllHospitals,
} from "../services/hospitalService";

import hospitalIconImg from "../assets/hospital.png";
import accidentIconImg from "../assets/accident.png";

import "leaflet/dist/leaflet.css";

// ======================================================
// LEAFLET DEFAULT ICON FIX
// ======================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ======================================================
// HOSPITAL ICON
// ======================================================

const hospitalIcon = new L.Icon({
  iconUrl: hospitalIconImg,
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -40],
});

// ======================================================
// ACCIDENT ICON
// ======================================================

const accidentIcon = new L.Icon({
  iconUrl: accidentIconImg,
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -40],
});

// ======================================================
// VALID COORDINATE CHECK
// ======================================================

const validCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// ======================================================
// CHECK ACTIVE ACCIDENT
// ======================================================

const isActiveAccident = (accident) => {
  const status = String(accident?.status || "Active")
    .trim()
    .toLowerCase();

  return status !== "resolved";
};

// ======================================================
// FORMAT DISTANCE
// ======================================================

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) {
    return "—";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
};

// ======================================================
// FORMAT DURATION
// ======================================================

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "—";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours} hr ${remaining} min`;
};

// ======================================================
// ESTIMATED TRAFFIC
// IMPORTANT:
// OSRM DOES NOT PROVIDE LIVE TRAFFIC.
// This is only an estimated traffic indicator.
// ======================================================

const getTrafficInfo = (route) => {
  if (
    !route ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration) ||
    route.duration <= 0
  ) {
    return {
      level: "Unknown",
      emoji: "⚪",
      color: "#64748b",
      background: "#f1f5f9",
      message: "Traffic information unavailable",
      speed: null,
    };
  }

  const distanceKm = route.distance / 1000;
  const durationHours = route.duration / 3600;

  const averageSpeed =
    distanceKm / durationHours;

  /*
    Approximate classification:

    > 35 km/h  = Low
    20-35 km/h = Medium
    < 20 km/h  = High

    This is NOT live traffic data.
  */

  if (averageSpeed > 35) {
    return {
      level: "Low Traffic",
      emoji: "🟢",
      color: "#15803d",
      background: "#dcfce7",
      message: "Traffic appears light",
      speed: averageSpeed,
    };
  }

  if (averageSpeed >= 20) {
    return {
      level: "Medium Traffic",
      emoji: "🟡",
      color: "#a16207",
      background: "#fef9c3",
      message: "Moderate traffic expected",
      speed: averageSpeed,
    };
  }

  return {
    level: "High Traffic",
    emoji: "🔴",
    color: "#dc2626",
    background: "#fee2e2",
    message: "Heavy traffic may be present",
    speed: averageSpeed,
  };
};

// ======================================================
// ROUTE INSTRUCTION TEXT
// ======================================================

const getInstructionText = (step) => {
  const maneuver = step?.maneuver || {};

  const type = maneuver.type || "";
  const modifier = maneuver.modifier || "";

  const street = step.name || "the road";

  if (type === "depart") {
    return `Start on ${street}`;
  }

  if (type === "arrive") {
    return "You have arrived at the accident location";
  }

  if (
    type === "roundabout" ||
    type === "rotary"
  ) {
    if (maneuver.exit) {
      return `At the roundabout, take exit ${maneuver.exit} onto ${street}`;
    }

    return `Enter the roundabout and continue onto ${street}`;
  }

  if (modifier === "uturn") {
    return `Make a U-turn onto ${street}`;
  }

  if (
    modifier === "left" ||
    modifier === "sharp left" ||
    modifier === "slight left"
  ) {
    if (modifier === "sharp left") {
      return `Turn sharp left onto ${street}`;
    }

    if (modifier === "slight left") {
      return `Keep slightly left onto ${street}`;
    }

    return `Turn left onto ${street}`;
  }

  if (
    modifier === "right" ||
    modifier === "sharp right" ||
    modifier === "slight right"
  ) {
    if (modifier === "sharp right") {
      return `Turn sharp right onto ${street}`;
    }

    if (modifier === "slight right") {
      return `Keep slightly right onto ${street}`;
    }

    return `Turn right onto ${street}`;
  }

  if (modifier === "straight") {
    return `Continue straight on ${street}`;
  }

  return `Continue on ${street}`;
};

// ======================================================
// ROAD ROUTE COMPONENT
// ======================================================

function RoadRoute({
  hospital,
  accident,
  onRouteUpdate,
}) {
  const map = useMap();

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] =
    useState(false);
  const [routeError, setRouteError] =
    useState(null);

  useEffect(() => {
    let cancelled = false;

    const getRoute = async () => {
      if (
        !hospital ||
        !accident ||
        !isActiveAccident(accident)
      ) {
        setRoute(null);
        setRouteError(null);

        if (onRouteUpdate) {
          onRouteUpdate(null);
        }

        return;
      }

      const hospitalLat =
        Number(hospital.latitude);

      const hospitalLng =
        Number(hospital.longitude);

      const accidentLat =
        Number(accident.latitude);

      const accidentLng =
        Number(accident.longitude);

      if (
        !validCoordinate(
          hospitalLat,
          hospitalLng
        ) ||
        !validCoordinate(
          accidentLat,
          accidentLng
        )
      ) {
        setRoute(null);

        setRouteError(
          "Invalid hospital or accident coordinates."
        );

        if (onRouteUpdate) {
          onRouteUpdate(null);
        }

        return;
      }

      setRouteLoading(true);
      setRouteError(null);

      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${hospitalLng},${hospitalLat};` +
          `${accidentLng},${accidentLat}` +
          `?overview=full` +
          `&geometries=geojson` +
          `&steps=true`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Routing server returned ${response.status}`
          );
        }

        const data = await response.json();

        if (
          data.code !== "Ok" ||
          !data.routes ||
          !data.routes.length
        ) {
          throw new Error(
            "No road route found."
          );
        }

        if (cancelled) {
          return;
        }

        const selectedRoute = data.routes[0];

        setRoute(selectedRoute);

        if (onRouteUpdate) {
          onRouteUpdate(selectedRoute);
        }

        if (
          selectedRoute.geometry?.coordinates
        ) {
          const latLngs =
            selectedRoute.geometry.coordinates.map(
              ([lng, lat]) => [lat, lng]
            );

          if (latLngs.length > 1) {
            const bounds =
              L.latLngBounds(latLngs);

            map.fitBounds(bounds, {
              padding: [70, 70],
              maxZoom: 16,
            });
          }
        }
      } catch (error) {
        console.error(
          "Route error:",
          error
        );

        if (!cancelled) {
          setRoute(null);

          setRouteError(
            "Unable to calculate road route."
          );

          if (onRouteUpdate) {
            onRouteUpdate(null);
          }
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    getRoute();

    return () => {
      cancelled = true;
    };
  }, [
    hospital,
    accident,
    map,
    onRouteUpdate,
  ]);

  // ====================================================
  // DRAW ROUTE
  // ====================================================

  useEffect(() => {
    if (
      !route?.geometry?.coordinates
    ) {
      return undefined;
    }

    const coordinates =
      route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

    const outerLine = L.polyline(
      coordinates,
      {
        color: "#ffffff",
        weight: 11,
        opacity: 0.7,
        lineCap: "round",
        lineJoin: "round",
      }
    );

    const polyline = L.polyline(
      coordinates,
      {
        color: "#2563eb",
        weight: 7,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }
    );

    outerLine.addTo(map);
    polyline.addTo(map);

    polyline.bringToFront();

    return () => {
      if (map.hasLayer(polyline)) {
        map.removeLayer(polyline);
      }

      if (map.hasLayer(outerLine)) {
        map.removeLayer(outerLine);
      }
    };
  }, [route, map]);

  // ====================================================
  // ROUTE SUMMARY CONTROL
  // ====================================================

  useEffect(() => {
    if (!route) {
      return undefined;
    }

    const traffic =
      getTrafficInfo(route);

    const control = L.control({
      position: "bottomleft",
    });

    control.onAdd = () => {
      const div = L.DomUtil.create(
        "div",
        "route-summary-control"
      );

      div.style.background = "#ffffff";
      div.style.padding = "12px 15px";
      div.style.borderRadius = "10px";
      div.style.boxShadow =
        "0 3px 15px rgba(0,0,0,0.25)";
      div.style.fontFamily =
        "Arial, sans-serif";
      div.style.minWidth = "230px";

      div.innerHTML = `
        <div style="
          font-weight:700;
          font-size:15px;
          color:#0f172a;
          margin-bottom:5px;
        ">
          🚑 Route to Accident
        </div>

        <div style="
          font-size:13px;
          color:#475569;
        ">
          📍 Distance:
          <strong>
            ${formatDistance(route.distance)}
          </strong>
        </div>

        <div style="
          font-size:13px;
          color:#475569;
          margin-top:3px;
        ">
          ⏱️ Estimated:
          <strong>
            ${formatDuration(route.duration)}
          </strong>
        </div>

        <div style="
          margin-top:8px;
          padding:7px 9px;
          border-radius:7px;
          background:${traffic.background};
          color:${traffic.color};
          font-size:12px;
          font-weight:700;
        ">
          ${traffic.emoji} ${traffic.level}
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);

      return div;
    };

    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [route, map]);

  return null;
}

// ======================================================
// MAP BUTTONS
// ======================================================

function MapButtons({
  hospital,
  accident,
}) {
  const map = useMap();

  const handleCompass = () => {
    if (
      hospital &&
      validCoordinate(
        hospital.latitude,
        hospital.longitude
      )
    ) {
      map.flyTo(
        [
          Number(hospital.latitude),
          Number(hospital.longitude),
        ],
        13,
        {
          duration: 1.2,
        }
      );

      return;
    }

    if (
      accident &&
      validCoordinate(
        accident.latitude,
        accident.longitude
      )
    ) {
      map.flyTo(
        [
          Number(accident.latitude),
          Number(accident.longitude),
        ],
        15,
        {
          duration: 1.2,
        }
      );

      return;
    }

    map.flyTo(
      [20.5937, 78.9629],
      5,
      {
        duration: 1.2,
      }
    );
  };

  const handleLocateHospital = () => {
    if (
      !hospital ||
      !validCoordinate(
        hospital.latitude,
        hospital.longitude
      )
    ) {
      alert(
        "Hospital location is not available."
      );

      return;
    }

    map.flyTo(
      [
        Number(hospital.latitude),
        Number(hospital.longitude),
      ],
      16,
      {
        duration: 1.5,
      }
    );
  };

  const handleLocateAccident = () => {
    if (
      !accident ||
      !validCoordinate(
        accident.latitude,
        accident.longitude
      )
    ) {
      alert(
        "No active accident location is available."
      );

      return;
    }

    map.flyTo(
      [
        Number(accident.latitude),
        Number(accident.longitude),
      ],
      17,
      {
        duration: 1.5,
      }
    );
  };

  const handleNavigation = () => {
    if (!hospital || !accident) {
      alert(
        "Hospital or active accident location is unavailable."
      );

      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${hospital.latitude},${hospital.longitude}` +
      `&destination=${accident.latitude},${accident.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        right: "15px",
        bottom: "25px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <button
        onClick={handleCompass}
        title="Reset map"
        style={buttonStyle}
      >
        🧭
      </button>

      <button
        onClick={handleLocateHospital}
        title="Locate hospital"
        style={buttonStyle}
      >
        🏥
      </button>

      <button
        onClick={handleLocateAccident}
        title="Locate active accident"
        style={buttonStyle}
      >
        🚨
      </button>

      {hospital && accident && (
        <button
          onClick={handleNavigation}
          title="Open navigation"
          style={{
            ...buttonStyle,
            background: "#2563eb",
            color: "#ffffff",
          }}
        >
          🚗
        </button>
      )}
    </div>
  );
}

// ======================================================
// BUTTON STYLE
// ======================================================

const buttonStyle = {
  width: "48px",
  height: "48px",
  border: "none",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#0f172a",

  boxShadow:
    "0 4px 14px rgba(0,0,0,0.25)",

  cursor: "pointer",
  fontSize: "22px",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ======================================================
// TRAFFIC LEGEND
// ======================================================

function TrafficLegend({ route }) {
  if (!route) {
    return null;
  }

  const traffic =
    getTrafficInfo(route);

  return (
    <div
      style={{
        marginTop: "15px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: "12px",
        }}
      >
        🚦 Traffic Status
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "20px",
            background: "#dcfce7",
            color: "#15803d",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          🟢 Low Traffic
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: "20px",
            background: "#fef9c3",
            color: "#a16207",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          🟡 Medium Traffic
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: "20px",
            background: "#fee2e2",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          🔴 High Traffic
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          borderRadius: "8px",
          background: traffic.background,
          color: traffic.color,
        }}
      >
        <strong>
          {traffic.emoji} {traffic.level}
        </strong>

        <div
          style={{
            fontSize: "12px",
            marginTop: "3px",
          }}
        >
          {traffic.message}
        </div>

        {traffic.speed !== null && (
          <div
            style={{
              fontSize: "12px",
              marginTop: "3px",
            }}
          >
            Estimated average route speed:{" "}
            {traffic.speed.toFixed(1)} km/h
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        ℹ️ Traffic level is estimated from the
        OSRM route duration. It is not live traffic
        data.
      </div>
    </div>
  );
}

// ======================================================
// TURN-BY-TURN DIRECTIONS PANEL
// ======================================================

function DirectionsPanel({ route }) {
  if (
    !route ||
    !route.legs ||
    !route.legs.length
  ) {
    return null;
  }

  const steps = route.legs.flatMap(
    (leg) => leg.steps || []
  );

  if (!steps.length) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "15px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "15px",
          background: "#0f172a",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontWeight: "700",
            fontSize: "16px",
          }}
        >
          🧭 Route Directions
        </div>

        <div
          style={{
            fontSize: "12px",
            marginTop: "4px",
            opacity: 0.8,
          }}
        >
          {formatDistance(route.distance)}
          {" • "}
          {formatDuration(route.duration)}
        </div>
      </div>

      <div
        style={{
          maxHeight: "260px",
          overflowY: "auto",
        }}
      >
        {steps.map((step, index) => {
          const instruction =
            getInstructionText(step);

          return (
            <div
              key={`${index}-${instruction}`}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px 14px",
                borderBottom:
                  "1px solid #e2e8f0",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  minWidth: "30px",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#dbeafe",
                  color: "#1d4ed8",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#0f172a",
                    lineHeight: "1.4",
                  }}
                >
                  {instruction}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    marginTop: "4px",
                  }}
                >
                  {formatDistance(step.distance)}
                  {" • "}
                  {formatDuration(step.duration)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ======================================================
// VOICE TURN-BY-TURN NAVIGATION
// Uses the GPS of the device running this page and the
// browser's built-in speech synthesis. GPS requires user
// permission and usually HTTPS (localhost is also allowed).
// ======================================================

function distanceBetweenMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function VoiceNavigation({ route }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationMessage, setNavigationMessage] = useState(
    "Press Start Voice Navigation and allow location access."
  );
  const [nextInstruction, setNextInstruction] = useState("");
  const [distanceToTurn, setDistanceToTurn] = useState(null);
  const watchIdRef = useRef(null);

  const steps = (route?.legs || []).flatMap((leg) => leg.steps || []);

  useEffect(() => {
    if (!isNavigating) return undefined;

    if (!navigator.geolocation) {
      setNavigationMessage("This browser does not support GPS location.");
      setIsNavigating(false);
      return undefined;
    }

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setNavigationMessage("This browser does not support voice announcements.");
      setIsNavigating(false);
      return undefined;
    }

    if (!steps.length) {
      setNavigationMessage("No route steps are available. Generate a route first.");
      setIsNavigating(false);
      return undefined;
    }

    // Skip the departure instruction because the user has already pressed Start.
    let nextStepIndex = steps.findIndex(
      (step) => step?.maneuver?.type && step.maneuver.type !== "depart"
    );
    if (nextStepIndex < 0) nextStepIndex = 0;

    const speak = (message) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    };

    setNavigationMessage("Voice navigation is running. Waiting for GPS...");
    speak("Voice navigation started. Follow the route.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLon = position.coords.longitude;

        if (nextStepIndex >= steps.length) {
          setNavigationMessage("You have reached the end of the route.");
          setDistanceToTurn(0);
          return;
        }

        const step = steps[nextStepIndex];
        const maneuverLocation = step?.maneuver?.location;

        // OSRM stores maneuver coordinates as [longitude, latitude].
        if (
          !Array.isArray(maneuverLocation) ||
          maneuverLocation.length < 2 ||
          !Number.isFinite(Number(maneuverLocation[0])) ||
          !Number.isFinite(Number(maneuverLocation[1]))
        ) {
          nextStepIndex += 1;
          return;
        }

        const turnDistance = distanceBetweenMeters(
          currentLat,
          currentLon,
          Number(maneuverLocation[1]),
          Number(maneuverLocation[0])
        );

        setDistanceToTurn(turnDistance);
        const instruction = getInstructionText(step);
        setNextInstruction(instruction);

        if (step?.maneuver?.type === "arrive" && turnDistance <= 500) {
          speak("You have arrived at the accident location.");
          setNavigationMessage("Arrived at the destination.");
          nextStepIndex = steps.length;
          return;
        }

        if (turnDistance <= 500) {
          const roundedDistance = Math.max(0, Math.round(turnDistance / 10) * 10);
          const spokenDistance = roundedDistance < 50 ? "now" : `in ${roundedDistance} metres`;
          speak(`${spokenDistance}, ${instruction}.`);
          setNavigationMessage(`Announced: ${instruction}`);
          nextStepIndex += 1;
        } else {
          setNavigationMessage("Navigation is running. Following your GPS location.");
        }
      },
      (error) => {
        let message = "Unable to get your location.";
        if (error.code === 1) message = "Location permission was denied. Allow location access in your browser.";
        if (error.code === 2) message = "Your current location is unavailable. Check your device GPS.";
        if (error.code === 3) message = "Getting your location timed out. Try again outdoors.";
        setNavigationMessage(message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, [isNavigating, route]);

  const stopNavigation = () => {
    setIsNavigating(false);
    setNavigationMessage("Voice navigation stopped.");
    setDistanceToTurn(null);
    window.speechSynthesis?.cancel();
  };

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "16px",
        border: "1px solid #bfdbfe",
        borderRadius: "12px",
        background: "#eff6ff",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a" }}>
        🔊 Voice Navigation
      </div>
      <div style={{ marginTop: "8px", fontSize: "13px", color: "#1e40af" }}>
        {navigationMessage}
      </div>
      {nextInstruction && (
        <div style={{ marginTop: "8px", fontSize: "13px", color: "#0f172a" }}>
          <strong>Next instruction:</strong> {nextInstruction}
          {Number.isFinite(distanceToTurn) && (
            <> ({formatDistance(distanceToTurn)} away)</>
          )}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
        {!isNavigating ? (
          <button
            type="button"
            onClick={() => setIsNavigating(true)}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ▶ Start Voice Navigation
          </button>
        ) : (
          <button
            type="button"
            onClick={stopNavigation}
            style={{
              border: 0,
              borderRadius: "8px",
              padding: "10px 14px",
              background: "#dc2626",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ■ Stop Navigation
          </button>
        )}
      </div>
      <div style={{ marginTop: "10px", fontSize: "11px", color: "#475569", lineHeight: 1.5 }}>
        Voice directions use this device's GPS. For navigation while an ambulance is moving,
        open this page on the ambulance driver's phone or connect the ambulance's live GPS to your backend.
      </div>
    </div>
  );
}

// ======================================================
// MAIN ACCIDENT MAP
// ======================================================

function AccidentMap({
  accidents = [],
}) {
  const [hospital, setHospital] =
    useState(null);

  const [hospitals, setHospitals] =
    useState([]);

  const [route, setRoute] =
    useState(null);

  // ====================================================
  // LOAD HOSPITAL DATA
  // ====================================================

  useEffect(() => {
    loadHospital();
    loadAllHospitals();
  }, []);

  const loadHospital = async () => {
    try {
      const response =
        await getProfile();

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

  const loadAllHospitals = async () => {
    try {
      const response =
        await getAllHospitals();

      setHospitals(
        response.data?.hospitals || []
      );
    } catch (error) {
      console.error(
        "Hospital list error:",
        error
      );
    }
  };

  // ====================================================
  // ACTIVE ACCIDENTS
  // ====================================================

  const activeAccidents =
    accidents.filter((item) =>
      isActiveAccident(item)
    );

  // ====================================================
  // VALID ACTIVE ACCIDENTS
  // ====================================================

  const validAccidents =
    [...activeAccidents]
      .filter((item) =>
        validCoordinate(
          item.latitude,
          item.longitude
        )
      )
      .sort(
        (a, b) =>
          new Date(
            b.timestamp || 0
          ) -
          new Date(
            a.timestamp || 0
          )
      );

  // ====================================================
  // LATEST ACTIVE ACCIDENT
  // ====================================================

  const latestAccident =
    validAccidents.length > 0
      ? validAccidents[0]
      : null;

  // ====================================================
  // REMOVE ROUTE WHEN NO ACCIDENT
  // ====================================================

  useEffect(() => {
    if (!latestAccident) {
      setRoute(null);
    }
  }, [latestAccident]);

  // ====================================================
  // MAP CENTER
  // ====================================================

  let mapCenter = [
    20.5937,
    78.9629,
  ];

  if (
    hospital &&
    validCoordinate(
      hospital.latitude,
      hospital.longitude
    )
  ) {
    mapCenter = [
      Number(hospital.latitude),
      Number(hospital.longitude),
    ];
  } else if (latestAccident) {
    mapCenter = [
      Number(latestAccident.latitude),
      Number(latestAccident.longitude),
    ];
  }

  return (
    <div
      style={{
        marginTop: "25px",
        background: "#ffffff",
        padding: "20px",
        borderRadius: "14px",

        boxShadow:
          "0 4px 20px rgba(0,0,0,0.10)",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "24px",
            }}
          >
            🚨 Live Accident Map
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Showing active accidents only
          </p>
        </div>

        <div
          style={{
            background:
              validAccidents.length > 0
                ? "#fee2e2"
                : "#dcfce7",

            color:
              validAccidents.length > 0
                ? "#dc2626"
                : "#16a34a",

            padding: "8px 15px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {validAccidents.length > 0
            ? `🚨 ${validAccidents.length} Active Accident${
                validAccidents.length !== 1
                  ? "s"
                  : ""
              }`
            : "✅ No Active Accidents"}
        </div>
      </div>

      {/* MAP */}

      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{
            height: "600px",
            width: "100%",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* MAP TYPES */}

          <LayersControl position="topright">
            <LayersControl.BaseLayer
              checked={true}
              name="🗺️ Street Map"
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer
              name="🛰️ Satellite"
            >
              <TileLayer
                attribution="Tiles © Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer
              name="🏔️ Terrain"
            >
              <TileLayer
                attribution="Tiles © Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer
              name="🌙 Dark Map"
            >
              <TileLayer
                attribution="© OpenStreetMap contributors © CARTO"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer
              name="🌐 Humanitarian"
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* MAP BUTTONS */}

          <MapButtons
            hospital={hospital}
            accident={latestAccident}
          />

          {/* MY HOSPITAL */}

          {hospital &&
            validCoordinate(
              hospital.latitude,
              hospital.longitude
            ) && (
              <Marker
                position={[
                  Number(hospital.latitude),
                  Number(hospital.longitude),
                ]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "220px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        color: "#2563eb",
                      }}
                    >
                      🏥 My Hospital
                    </h3>

                    <strong>
                      {hospital.hospitalName}
                    </strong>

                    <br />
                    <br />

                    <strong>
                      Address
                    </strong>

                    <br />

                    {hospital.address ||
                      "Address unavailable"}

                    <br />
                    <br />

                    <strong>
                      Phone
                    </strong>

                    <br />

                    📞{" "}
                    {hospital.phone ||
                      "N/A"}
                  </div>
                </Popup>
              </Marker>
            )}

          {/* OTHER HOSPITALS */}

          {hospitals
            .filter(
              (item) =>
                item._id !==
                  hospital?._id &&
                validCoordinate(
                  item.latitude,
                  item.longitude
                )
            )
            .map((item) => (
              <Marker
                key={item._id}
                position={[
                  Number(item.latitude),
                  Number(item.longitude),
                ]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "220px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        color: "#2563eb",
                      }}
                    >
                      🏥{" "}
                      {item.hospitalName}
                    </h3>

                    <strong>
                      Address
                    </strong>

                    <br />

                    {item.address ||
                      "Address unavailable"}

                    <br />
                    <br />

                    <strong>
                      Phone
                    </strong>

                    <br />

                    📞{" "}
                    {item.phone ||
                      "N/A"}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ACTIVE ACCIDENT MARKERS */}

          {validAccidents.map(
            (item, index) => (
              <Marker
                key={
                  item._id ||
                  `${item.latitude}-${item.longitude}-${index}`
                }
                position={[
                  Number(item.latitude),
                  Number(item.longitude),
                ]}
                icon={accidentIcon}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "240px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        color: "#dc2626",
                      }}
                    >
                      🚨 Active Accident
                    </h3>

                    <strong>
                      Device ID
                    </strong>

                    <br />

                    {item.deviceId ||
                      "Unknown"}

                    <br />
                    <br />

                    <strong>
                      Accident Type
                    </strong>

                    <br />

                    {item.accidentType ||
                      "Unknown"}

                    <br />
                    <br />

                    <strong>
                      Severity
                    </strong>

                    <br />

                    <span
                      style={{
                        fontWeight: "bold",
                        color:
                          item.severity ===
                          "High"
                            ? "#dc2626"
                            : item.severity ===
                              "Medium"
                            ? "#f97316"
                            : "#16a34a",
                      }}
                    >
                      {item.severity ||
                        "Low"}
                    </span>

                    <br />
                    <br />

                    <strong>
                      Status
                    </strong>

                    <br />

                    {item.status ||
                      "Active"}

                    <br />
                    <br />

                    <strong>
                      Coordinates
                    </strong>

                    <br />

                    {Number(
                      item.latitude
                    ).toFixed(6)}
                    ,{" "}
                    {Number(
                      item.longitude
                    ).toFixed(6)}

                    <br />
                    <br />

                    <strong>
                      Time
                    </strong>

                    <br />

                    {item.timestamp
                      ? new Date(
                          item.timestamp
                        ).toLocaleString()
                      : "N/A"}

                    {hospital && (
                      <button
                        onClick={() => {
                          const url =
                            `https://www.google.com/maps/dir/?api=1` +
                            `&origin=${hospital.latitude},${hospital.longitude}` +
                            `&destination=${item.latitude},${item.longitude}`;

                          window.open(
                            url,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        style={{
                          width: "100%",
                          marginTop: "15px",
                          padding: "10px",
                          border: "none",
                          borderRadius: "8px",
                          background:
                            "#2563eb",
                          color: "#ffffff",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        🧭 Open Navigation
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          )}

          {/* ROAD ROUTE */}

          {hospital &&
            latestAccident && (
              <RoadRoute
                hospital={hospital}
                accident={latestAccident}
                onRouteUpdate={setRoute}
              />
            )}
        </MapContainer>
      </div>

      {/* TRAFFIC STATUS */}

      <TrafficLegend route={route} />

      {/* TURN-BY-TURN DIRECTIONS */}

      {route && latestAccident && (
        <DirectionsPanel route={route} />
      )}

      {/* VOICE NAVIGATION */}
      {route && latestAccident && (
        <VoiceNavigation route={route} />
      )}

      {/* INFORMATION CARDS */}

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "15px",
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            🏥 Registered Hospitals
          </h3>

          <h2
            style={{
              marginBottom: 0,
              color: "#2563eb",
            }}
          >
            {hospitals.length}
          </h2>
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            🚨 Active Accidents
          </h3>

          <h2
            style={{
              marginBottom: 0,
              color:
                validAccidents.length > 0
                  ? "#dc2626"
                  : "#16a34a",
            }}
          >
            {validAccidents.length}
          </h2>
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: "18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            📍 Latest Active Accident
          </h3>

          {latestAccident ? (
            <>
              <p>
                <strong>
                  Latitude:
                </strong>{" "}
                {Number(
                  latestAccident.latitude
                ).toFixed(6)}
              </p>

              <p>
                <strong>
                  Longitude:
                </strong>{" "}
                {Number(
                  latestAccident.longitude
                ).toFixed(6)}
              </p>
            </>
          ) : (
            <p>
              No active accident location
              available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccidentMap;