const express = require("express");

const {
  login,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/auth.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth");

const router = express.Router();

// =========================================================
// LOGIN
// =========================================================

router.post("/login", login);

// =========================================================
// EMPLOYEE MANAGEMENT
// ADMIN ONLY
// =========================================================

router.get(
  "/employees",
  authenticate,
  authorize("ADMIN"),
  getEmployees
);

router.post(
  "/employees",
  authenticate,
  authorize("ADMIN"),
  createEmployee
);

router.put(
  "/employees/:id",
  authenticate,
  authorize("ADMIN"),
  updateEmployee
);

router.delete(
  "/employees/:id",
  authenticate,
  authorize("ADMIN"),
  deleteEmployee
);

module.exports = router;