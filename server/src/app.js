const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const axios = require("axios");
const reconciliationRoutes = require("./routes/reconciliation.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/reconcile", reconciliationRoutes);

// Basic health check route
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Reconciliation Engine is running." });
});

// --- KEEP-ALIVE CRON JOB ---
// Pings the /api/health endpoint every 10 minutes to prevent Render from sleeping
const RENDER_URL =
  "https://ai-reconciliation-backend-4wk0.onrender.com/api/health";

cron.schedule("*/10 * * * *", async () => {
  try {
    await axios.get(RENDER_URL);
    console.log(
      `[Keep-Alive] Successfully pinged Render server at ${new Date().toLocaleTimeString()}`,
    );
  } catch (error) {
    console.error("[Keep-Alive] Ping failed:", error.message);
  }
});

module.exports = app;
