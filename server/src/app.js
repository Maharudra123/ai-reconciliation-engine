const express = require("express");
const cors = require("cors");
const reconciliationRoutes = require("./routes/reconciliation.routes"); // NEW

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/reconcile", reconciliationRoutes); // NEW

// Basic health check route
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Reconciliation Engine is running." });
});

module.exports = app;
