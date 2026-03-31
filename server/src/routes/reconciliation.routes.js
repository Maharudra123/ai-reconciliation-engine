const express = require("express");
const router = express.Router();
const {
  getReconciliationReport,
} = require("../controllers/reconciliation.controller");

// GET /api/reconcile
router.get("/", getReconciliationReport);

module.exports = router;
