function Navbar() {
  return (
    <header
      className="navbar"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "95px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxSizing: "border-box",
        padding: "18px 70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Center Title */}
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: "700",
            color: "#0f172a",
          }}
        >
          Emergency Dashboard
        </h1>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Smart Accident Detection & Alert System
        </p>
      </div>

      {/* Right Side - System Status */}
      <div
        style={{
          position: "absolute",
          right: "25px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#166534",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              boxShadow: "0 0 0 4px #dcfce7",
            }}
          />

          System Online
        </div>
      </div>
    </header>
  );
}

export default Navbar;