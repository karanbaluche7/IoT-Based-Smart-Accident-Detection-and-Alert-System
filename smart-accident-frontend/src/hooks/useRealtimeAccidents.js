
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { getAllAccidents } from "../services/accidentService";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

// Get the logged-in hospital ID.
const getHospitalId = () => {
  try {
    const hospitalData = localStorage.getItem("hospital");

    if (hospitalData) {
      const hospital = JSON.parse(hospitalData);
      return hospital?._id || hospital?.id || null;
    }

    const userData = localStorage.getItem("user");

    if (userData) {
      const user = JSON.parse(userData);
      return user?._id || user?.id || null;
    }

    return null;
  } catch (error) {
    console.error("Hospital ID error:", error);
    return null;
  }
};

// Safely get an accident ID.
const getId = (accident) => {
  const id = accident?._id || accident?.id;
  return id ? String(id) : null;
};

// Sort newest accidents first.
const sortAccidents = (items) => {
  return [...items].sort((a, b) => {
    const dateA = new Date(
      a.timestamp || a.createdAt || 0
    ).getTime();

    const dateB = new Date(
      b.timestamp || b.createdAt || 0
    ).getTime();

    return dateB - dateA;
  });
};

export default function useRealtimeAccidents() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const mountedRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // Prevent overlapping API requests.
  const requestInProgressRef = useRef(false);

  // Changes made by Socket.IO while an API request is running.
  const realtimeChangedIdsRef = useRef(new Set());

  // IDs that must not be restored by an older API response.
  // The value is "removed" or "updated".
  const realtimeOverridesRef = useRef(new Map());

  const loadAccidents = useCallback(async () => {
    if (requestInProgressRef.current) {
      return;
    }

    requestInProgressRef.current = true;

    if (!initialLoadDoneRef.current && mountedRef.current) {
      setLoading(true);
    }

    // Track changes that happen after this request starts.
    realtimeChangedIdsRef.current = new Set();

    try {
      const response = await getAllAccidents();
      const incoming = response?.data?.accidents;

      if (!Array.isArray(incoming)) {
        console.warn(
          "Unexpected accident API response:",
          response?.data
        );
        return;
      }

      if (!mountedRef.current) {
        return;
      }

      const changedIds = realtimeChangedIdsRef.current;
      const overrides = realtimeOverridesRef.current;

      // The API response is the authoritative list for this hospital.
      const incomingById = new Map();

      incoming.forEach((accident) => {
        const id = getId(accident);

        if (id) {
          incomingById.set(id, accident);
        }
      });

      // Apply Socket.IO changes received while this request was running.
      changedIds.forEach((id) => {
        const override = overrides.get(id);

        if (override?.type === "removed") {
          incomingById.delete(id);
          return;
        }

        if (override?.type === "updated" && override.accident) {
          incomingById.set(id, override.accident);
        }
      });

      setAccidents(sortAccidents(Array.from(incomingById.values())));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Accident loading error:", error);
      // Keep the existing list if the API request fails.
    } finally {
      requestInProgressRef.current = false;
      initialLoadDoneRef.current = true;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const socket = connectSocket();
    const hospitalId = getHospitalId();

    // Mark an accident as changed during an in-flight API request.
    const markRealtimeChange = (id, override) => {
      if (!id) return;

      const normalizedId = String(id);

      realtimeChangedIdsRef.current.add(normalizedId);
      realtimeOverridesRef.current.set(normalizedId, override);
    };

    const upsertAccident = (accident) => {
      const id = getId(accident);

      if (!id) return;

      markRealtimeChange(id, {
        type: "updated",
        accident,
      });

      setAccidents((previous) => {
        const exists = previous.some(
          (item) => getId(item) === id
        );

        const next = exists
          ? previous.map((item) =>
              getId(item) === id
                ? { ...item, ...accident }
                : item
            )
          : [accident, ...previous];

        return sortAccidents(next);
      });

      setLastUpdated(new Date());
    };

    const removeAccident = (id) => {
      if (!id) return;

      const normalizedId = String(id);

      markRealtimeChange(normalizedId, {
        type: "removed",
      });

      setAccidents((previous) =>
        previous.filter(
          (item) => getId(item) !== normalizedId
        )
      );

      setLastUpdated(new Date());
    };

    // Socket connection and hospital room.
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setConnected(true);

      if (hospitalId) {
        socket.emit("join-hospital", hospitalId);

        console.log(
          "Joined hospital room:",
          `hospital:${hospitalId}`
        );
      } else {
        console.warn("Hospital ID not found in localStorage.");
      }
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setConnected(false);
    };

    // A new accident is assigned to this hospital.
    const handleNewAccident = (accident) => {
      console.log("NEW ACCIDENT:", accident);

      const id = getId(accident);
      if (!id) return;

      const alreadyExists = accidents.some(
        (item) => getId(item) === id
      );

      upsertAccident(accident);

      if (!alreadyExists) {
        toast.error("🚨 NEW ACCIDENT DETECTED", {
          autoClose: false,
          closeOnClick: true,
        });
      }
    };

    // Accident status or details updated.
    const handleAccidentUpdated = (accident) => {
      console.log("ACCIDENT UPDATED:", accident);

      if (!getId(accident)) return;

      upsertAccident(accident);
    };

    // Accident deleted.
    const handleAccidentDeleted = (data) => {
      console.log("ACCIDENT DELETED:", data);

      const id = data?.accidentId || data?._id || data;
      removeAccident(id);
    };

    // Accident forwarded to another hospital.
    // Backend currently emits:
    // { accidentId, newHospitalId }
    const handleAccidentReassigned = (data) => {
      console.log("ACCIDENT REASSIGNED:", data);

      const accidentId =
        data?.accidentId || getId(data?.accident);

      const newHospitalId =
        data?.newHospitalId ||
        data?.hospital?.id ||
        data?.hospital?._id ||
        data?.accident?.assignedHospital?._id ||
        data?.accident?.assignedHospital;

      if (!accidentId) {
        console.warn(
          "Reassignment event has no accident ID."
        );
        return;
      }

      const belongsToThisHospital =
        hospitalId &&
        newHospitalId &&
        String(newHospitalId) === String(hospitalId);

      if (belongsToThisHospital) {
        // This hospital is the new recipient.
        if (data?.accident) {
          upsertAccident(data.accident);
        } else {
          // The event contains IDs only; fetch the current list.
          // The current request guard may skip this call, but the
          // periodic refresh can retrieve the accident later.
          loadAccidents();
        }
      } else {
        // The accident no longer belongs to this hospital.
        removeAccident(accidentId);
      }
    };

    // A forwarded accident arrives at the receiving hospital.
    const handleNearbyHospitalAlert = (data) => {
      console.log("NEARBY HOSPITAL ALERT:", data);

      const accident = data?.accident;
      if (!accident) return;

      const assignedHospital =
        accident?.assignedHospital?._id ||
        accident?.assignedHospital;

      if (
        hospitalId &&
        assignedHospital &&
        String(assignedHospital) === String(hospitalId)
      ) {
        const id = getId(accident);

        const alreadyExists = accidents.some(
          (item) => getId(item) === id
        );

        upsertAccident(accident);

        if (!alreadyExists) {
          toast.error(
            "🚑 EMERGENCY FORWARDED TO YOUR HOSPITAL",
            {
              autoClose: false,
              closeOnClick: true,
            }
          );
        }
      }
    };

    // Register event listeners.
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("accident:new", handleNewAccident);
    socket.on("accident:updated", handleAccidentUpdated);
    socket.on("accident:deleted", handleAccidentDeleted);
    socket.on("accident:reassigned", handleAccidentReassigned);
    socket.on("nearby-hospital-alert", handleNearbyHospitalAlert);

    // Load initial data after registering listeners so no event is missed.
    loadAccidents();

    // The socket may already be connected.
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      mountedRef.current = false;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("accident:new", handleNewAccident);
      socket.off("accident:updated", handleAccidentUpdated);
      socket.off("accident:deleted", handleAccidentDeleted);
      socket.off("accident:reassigned", handleAccidentReassigned);
      socket.off("nearby-hospital-alert", handleNearbyHospitalAlert);

      disconnectSocket();
    };
  }, [loadAccidents]);

  return {
    accidents,
    setAccidents,
    loading,
    connected,
    lastUpdated,
    refresh: loadAccidents,
  };
}