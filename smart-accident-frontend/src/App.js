
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LiveAccidents from "./pages/LiveAccidents";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PersonDetails from "./pages/PersonDetails";
import AccidentDetails from "./pages/AccidentDetails";
import ProtectedRoute from "./components/ProtectedRoute";

// Device Administrator pages
import DeviceLogin from "./pages/DeviceLogin";
import DeviceDashboard from "./pages/DeviceDashboard";
import DeviceRegister from "./pages/DeviceRegister";

import "./styles/main.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Hospital login and registration */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Protected hospital routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/live-accidents"
            element={<LiveAccidents />}
          />

          <Route
            path="/history"
            element={<History />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>

        {/* Accident details */}
        <Route
          path="/person-details/:id"
          element={<PersonDetails />}
        />

        <Route
          path="/accident-details/:id"
          element={<AccidentDetails />}
        />

        {/* Device Administrator routes */}
        <Route
          path="/distributor-login"
          element={<DeviceLogin />}
        />

        <Route
          path="/device-dashboard"
          element={<DeviceDashboard />}
        />

        <Route
          path="/device-register"
          element={<DeviceRegister />}
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;