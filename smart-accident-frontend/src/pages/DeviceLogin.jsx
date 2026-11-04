
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShieldCheck, HeartPulse } from "lucide-react";
import "../styles/Auth.css";

function DeviceLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/provider/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password."
        );
      }

      if (!data.token || !data.provider) {
        throw new Error(
          "Invalid response from server. Token or provider information is missing."
        );
      }

      // Save device administrator login details
      sessionStorage.setItem("providerToken", data.token);
      sessionStorage.setItem(
        "providerInfo",
        JSON.stringify(data.provider)
      );

      toast.success("Device Administrator login successful!");

      // Navigate to the route defined in App.js
      navigate("/device-dashboard", { replace: true });
    } catch (error) {
      console.error("Device administrator login error:", error);

      toast.error(
        error.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Login role switch */}
        <div className="login-type-switch">
          <Link
            className="login-type-btn"
            to="/login"
          >
            Hospital Login
          </Link>

          <button
            type="button"
            className="login-type-btn active"
            aria-current="page"
          >
            Device Administrator Login
          </button>
        </div>

        {/* Logo */}
        <div className="auth-logo">
          <ShieldCheck size={38} />
        </div>

        {/* Header */}
        <div className="auth-header">
          <h1>Device Administrator Login</h1>
          <p>
            Sign in to register accident detection devices, manage registered devices, and maintain vehicle details.
          </p>
        </div>

        {/* Login form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Administrator Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Secure Login"}
          </button>
        </form>

        {/* Security information */}
        <div className="auth-security">
          <HeartPulse size={15} /><br />
          <span>Secure Device Management Access</span>
        </div>
      </div>
    </div>
  );
}

export default DeviceLogin;