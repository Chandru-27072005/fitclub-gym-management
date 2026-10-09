
const memberRoutes = require("./routes/memberRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());

// CORS: Allow local frontend and deployed Vercel frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fitclub-gym-management.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests
app.use(express.json({ limit: "10kb" }));

// API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// API routes
app.use("/api/members", memberRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "FitZone Gym Management API is running",
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

// Start server and connect to MongoDB
async function startServer() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected successfully");
    } else {
      console.log("MONGODB_URI missing; starting without database");
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
