"use strict";

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { dateRangeRules } = require("../validators");
const reportController = require("../controllers/report.controller");

router.use(authenticate);

// ─── GET /api/v1/reports/summary?from=&to= ────────────────────────────────
router.get("/summary", dateRangeRules(), validate, reportController.getSummary);

// ─── GET /api/v1/reports/top-products?from=&to=&limit= ───────────────────
router.get(
  "/top-products",
  dateRangeRules(),
  validate,
  reportController.getTopProducts
);

// ─── GET /api/v1/reports/low-stock ───────────────────────────────────────
router.get("/low-stock", reportController.getLowStock);

module.exports = router;
