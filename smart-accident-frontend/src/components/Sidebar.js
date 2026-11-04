import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setOpen(false);
    navigate("/login");
  };

  const menuClass = ({ isActive }) =>
    `attractive-menu-item ${isActive ? "active" : ""}`;

  return (
    <>
      {/* =========================
          HAMBURGER BUTTON
      ========================== */}

      <button
        className={`hamburger-btn ${open ? "hide-hamburger" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>


      {/* =========================
          OVERLAY
      ========================== */}

      {open && (
        <div
          className="menu-overlay"
          onClick={closeMenu}
        ></div>
      )}


      {/* =========================
          SIDEBAR
      ========================== */}

      <aside
        className={`attractive-sidebar ${
          open ? "sidebar-visible" : ""
        }`}
      >

        {/* Header */}

        <div className="sidebar-top">

          <div className="brand-section">

            <div className="brand-icon">
              🚑
            </div>

            <div>
              <h2>Smart Accident</h2>
              <p>Emergency Management</p>
            </div>

          </div>

          <button
            className="close-btn"
            onClick={closeMenu}
          >
            ×
          </button>

        </div>


        {/* Status */}

        <div className="system-status">

          <span className="status-dot"></span>

          <div>
            <strong>System Online</strong>
            <small>Monitoring active</small>
          </div>

        </div>


        {/* Navigation */}

        <div className="menu-title">
          MAIN MENU
        </div>

        <nav className="attractive-navigation">

          <NavLink
            to="/dashboard"
            className={menuClass}
            onClick={closeMenu}
          >
            <span className="menu-icon">📊</span>

            <span className="menu-text">
              Dashboard
            </span>

            <span className="arrow">
              ›
            </span>
          </NavLink>


          <NavLink
            to="/live-accidents"
            className={menuClass}
            onClick={closeMenu}
          >
            <span className="menu-icon">🚨</span>

            <span className="menu-text">
              Live Accidents
            </span>

            <span className="arrow">
              ›
            </span>
          </NavLink>


          <NavLink
            to="/history"
            className={menuClass}
            onClick={closeMenu}
          >
            <span className="menu-icon">📜</span>

            <span className="menu-text">
              Accident History
            </span>

            <span className="arrow">
              ›
            </span>
          </NavLink>

        </nav>


        {/* Bottom Section */}

        <div className="sidebar-bottom">

          <div className="menu-title">
            ACCOUNT
          </div>


          <NavLink
            to="/profile"
            className={menuClass}
            onClick={closeMenu}
          >
            <span className="menu-icon">👤</span>

            <span className="menu-text">
              Hospital Profile
            </span>

            <span className="arrow">
              ›
            </span>
          </NavLink>


          <button
            className="attractive-logout"
            onClick={handleLogout}
          >
            <span className="menu-icon">
              🚪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>


        {/* Footer */}

        <div className="sidebar-footer">

          <div className="footer-icon">
            🛡️
          </div>

          <div>
            <strong>Smart Safety</strong>
            <small>Accident Response System</small>
          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;