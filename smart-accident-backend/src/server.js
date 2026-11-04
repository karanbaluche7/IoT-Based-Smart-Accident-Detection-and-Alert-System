require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// =====================================================
// PHONE LOCATION STORAGE
// =====================================================

let latestLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  updatedAt: null,
};

// Receive GPS location from phone
app.post("/api/location", (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    latestLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : null,
      updatedAt: new Date(),
    };

    console.log("=================================");
    console.log("📍 PHONE LOCATION UPDATED");
    console.log("Latitude :", latestLocation.latitude);
    console.log("Longitude:", latestLocation.longitude);
    console.log("Accuracy :", latestLocation.accuracy);
    console.log("=================================");

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: latestLocation,
    });

  } catch (error) {
    console.error("Location update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update location",
    });
  }
});


// ESP32 gets latest phone location
app.get("/api/location", (req, res) => {
  try {

    if (
      latestLocation.latitude === null ||
      latestLocation.longitude === null
    ) {
      return res.status(404).json({
        success: false,
        message: "Phone location not available",
      });
    }

    res.status(200).json({
      success: true,
      location: latestLocation,
    });

  } catch (error) {
    console.error("Get location error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get location",
    });
  }
});


// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);


// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:3000",

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ],

    credentials: true,
  },

  transports: [
    "websocket",
    "polling",
  ],
});


// Make Socket.IO available to controllers
app.set("io", io);


// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

io.on("connection", (socket) => {

  console.log(
    `🔌 Dashboard connected: ${socket.id}`
  );


  socket.on("hospital:join", (hospitalId) => {

    if (!hospitalId) {

      console.log(
        "⚠️ Hospital ID not provided"
      );

      return;
    }


    const room = `hospital:${hospitalId}`;

    socket.join(room);


    console.log(
      `🏥 Hospital joined room: ${room}`
    );
  });


  socket.on("disconnect", (reason) => {

    console.log(
      `❌ Dashboard disconnected: ${socket.id}`
    );

    console.log(
      `Reason: ${reason}`
    );
  });

});


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {

  try {

    await connectDB();


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "================================="
        );

        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          `🌐 Local: http://localhost:${PORT}`
        );

        console.log(
          `🌐 Network: http://10.44.91.232:${PORT}`
        );

        console.log(
          "🔌 Socket.IO: Enabled"
        );

        console.log(
          "📍 Phone Location API: Enabled"
        );

        console.log(
          "================================="
        );
      }
    );

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    process.exit(1);
  }
};


startServer();