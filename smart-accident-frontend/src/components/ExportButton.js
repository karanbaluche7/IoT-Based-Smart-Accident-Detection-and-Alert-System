import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ExportButton({ accidents }) {

  const exportPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Smart Accident Detection System", 14, 18);

    doc.setFontSize(13);
    doc.text("Accident Report", 14, 28);

    const tableData = accidents.map((item, index) => [
      index + 1,
      item.deviceId,
      item.severity,
      item.status,
      item.latitude,
      item.longitude,
      new Date(item.timestamp).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 40,

      head: [[
        "S.No",
        "Device ID",
        "Severity",
        "Status",
        "Latitude",
        "Longitude",
        "Time",
      ]],

      body: tableData,
    });

    doc.save("Accident_Report.pdf");
  };

  return (
    <button
      onClick={exportPDF}
      style={{
        background: "#2563eb",
        color: "#fff",
        border: "none",
        padding: "12px 25px",
        borderRadius: "8px",
        cursor: "pointer",
        marginBottom: "20px",
        fontWeight: "bold",
        fontSize: "15px",
      }}
    >
      📄 Export Report
    </button>
  );
}

export default ExportButton;