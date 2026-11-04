function StatusCard({
  title,
  value,
  color = "#2563eb",
  icon = "📊",
}) {
  const getCardClass = () => {
    if (color === "#dc2626" || color === "#ef4444") {
      return "danger";
    }

    if (color === "#16a34a" || color === "#22c55e") {
      return "success";
    }

    if (color === "#f59e0b" || color === "#f97316") {
      return "warning";
    }

    return "";
  };

  return (
    <div className={`status-card ${getCardClass()}`}>

      <div className="status-card-content">

        <div>
          <div className="status-card-title">
            {title}
          </div>

          <div
            className="status-card-value"
            style={{ color }}
          >
            {value}
          </div>
        </div>

        <div className="status-card-icon">
          {icon}
        </div>

      </div>

    </div>
  );
}

export default StatusCard;