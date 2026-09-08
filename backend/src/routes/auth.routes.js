const express = require("express");

const {
  login,
  getEmployees,
} = require("../controllers/auth.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth");

const router = express.Router();

// Login
router.post("/login", login);

// Employees - Admin only
router.get(
  "/employees",
  authenticate,
  authorize("ADMIN"),
  getEmployees
);

module.exports = router;