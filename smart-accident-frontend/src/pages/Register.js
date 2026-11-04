import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  HeartPulse,
  ShieldCheck,
  MapPin,
  LoaderCircle,
} from "lucide-react";

import { register } from "../services/authService";
import { getCurrentLocation } from "../services/locationService";

import { toast } from "react-toastify";

import "../styles/Auth.css";

function Register() {

  const navigate = useNavigate();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [formData, setFormData] = useState({
    hospitalName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });


  const [loading, setLoading] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(true);


  // ==========================================
  // GET HOSPITAL LOCATION
  // ==========================================

  useEffect(() => {

    const fetchLocation = async () => {

      try {

        setLocationLoading(true);

        const location =
          await getCurrentLocation();

        setFormData((prev) => ({
          ...prev,

          latitude:
            location.latitude,

          longitude:
            location.longitude,
        }));

      } catch (error) {

        console.error(
          "Location error:",
          error
        );

        toast.error(
          "Unable to fetch hospital location. Please allow location access."
        );

      } finally {

        setLocationLoading(false);

      }
    };


    fetchLocation();

  }, []);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };


  // ==========================================
  // REGISTER
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    // Basic validation
    if (
      !formData.hospitalName ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.address
    ) {

      toast.error(
        "Please fill all required fields."
      );

      return;
    }


    // Location validation
    if (
      formData.latitude === "" ||
      formData.longitude === ""
    ) {

      toast.error(
        "Hospital location is required."
      );

      return;
    }


    try {

      setLoading(true);


      await register(formData);


      toast.success(
        "Hospital registered successfully!"
      );


      // Go to login
      setTimeout(() => {
        navigate("/login");
      }, 800);


    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="auth-wrapper">

      <div className="auth-card">

        {/* ======================================
            LOGO
        ======================================= */}

        <div className="auth-logo">

          <HeartPulse size={38} />

        </div>


        {/* ======================================
            HEADER
        ======================================= */}

        <div className="auth-header">

          <h1>
            Hospital Registration
          </h1>

          <p>
            Create your hospital emergency account
          </p>

        </div>


        {/* ======================================
            REGISTER FORM
        ======================================= */}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* Hospital Name */}

          <input
            type="text"
            name="hospitalName"
            placeholder="Hospital Name"
            value={formData.hospitalName}
            onChange={handleChange}
            autoComplete="organization"
            required
          />


          {/* Email */}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />


          {/* Password */}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />


          {/* Phone */}

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            required
          />


          {/* Address */}

          <input
            type="text"
            name="address"
            placeholder="Hospital Address"
            value={formData.address}
            onChange={handleChange}
            autoComplete="street-address"
            required
          />


          {/* ==================================
              LOCATION
          =================================== */}

          <div
            style={{
              position: "relative",
            }}
          >

            <input
              type="text"
              value={
                formData.latitude
                  ? `Latitude: ${formData.latitude}`
                  : ""
              }
              readOnly
              placeholder="Hospital Latitude"
            />

          </div>


          <div
            style={{
              position: "relative",
            }}
          >

            <input
              type="text"
              value={
                formData.longitude
                  ? `Longitude: ${formData.longitude}`
                  : ""
              }
              readOnly
              placeholder="Hospital Longitude"
            />

          </div>


          {/* Location status */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "15px",
              fontSize: "12px",
              color: locationLoading
                ? "#64748b"
                : "#16a34a",
            }}
          >

            {locationLoading ? (
              <LoaderCircle
                size={14}
                className="spin"
              />
            ) : (
              <MapPin size={14} />
            )}

            <span>

              {locationLoading
                ? "Detecting hospital location..."
                : "Hospital location detected"}

            </span>

          </div>


          {/* ==================================
              REGISTER BUTTON
          =================================== */}

          <button
            type="submit"
            className="auth-btn"
            disabled={
              loading ||
              locationLoading
            }
          >

            {loading
              ? "Creating Account..."
              : "Register Hospital"}

          </button>

        </form>


        {/* ======================================
            LOGIN LINK
        ======================================= */}

        <div className="auth-links">

          <p>

            Already have an account?{" "}

            <Link to="/login">
              Login
            </Link>

          </p>

        </div>


        {/* ======================================
            SECURITY
        ======================================= */}

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

export default Register;