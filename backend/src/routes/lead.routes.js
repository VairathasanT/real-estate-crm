const express = require("express");

const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} = require("../controllers/lead.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth");

const router = express.Router();

// Authenticate all lead routes
router.use(authenticate);

// Lead routes
router.post("/", createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);

// Only ADMIN can delete leads
router.delete("/:id", authorize("ADMIN"), deleteLead);

module.exports = router;