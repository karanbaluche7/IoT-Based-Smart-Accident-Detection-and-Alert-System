
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { toast } from "react-toastify";
import { HeartPulse, ShieldCheck } from "lucide-react";

import "../styles/Auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await login(formData);

      if (!response.data?.token) {
        throw new Error(
          "Authentication token was not received."
        );
      }

      localStorage.setItem("token", response.data.token);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        {/* LOGIN TYPE SWITCH */}
        <div className="login-type-switch">
          <Link
            to="/login"
            className="login-type-btn active"
            aria-current="page"
          >
            Hospital Login
          </Link>

          <button
            type="button"
            className="login-type-btn"
            onClick={() => navigate("/distributor-login")}
          >
            Device Administrator Login
          </button>
        </div>

        {/* LOGO */}
        <div className="auth-logo">
          <HeartPulse size={38} />
        </div>

        {/* HEADER */}
        <div className="auth-header">
          <h1>Hospital Login</h1>
          <p>
            Login to continue to Emergency Dashboard
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          autoComplete="on"
        >
          <input
            type="email"
            name="email"
            id="hospital-email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            autoComplete="username"
            required
          />

          <input
            type="password"
            name="password"
            id="hospital-password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        {/* REGISTER LINK */}
        <div className="auth-links">
          <p>
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </div>

        {/* SECURITY */}
        <div className="auth-security">
          <ShieldCheck size={15} />
          <span>
            Secure hospital emergency system
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;