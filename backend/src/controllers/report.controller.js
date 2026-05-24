"use strict";

const reportService = require("../services/report.service");
const { ok } = require("../utils/response");

async function getSummary(req, res, next) {
  try {
    const data = await reportService.getSummary(req.query);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function getTopProducts(req, res, next) {
  try {
    const data = await reportService.getTopProducts(req.query);
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

async function getLowStock(req, res, next) {
  try {
    const data = await reportService.getLowStock();
    ok(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getTopProducts,
  getLowStock,
};
