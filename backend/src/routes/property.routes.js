const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  createBuilding,
  getBuildings,
  getBuildingById,
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
} = require("../controllers/property.controller");

const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

// ===============================
// PROJECTS
// ===============================

router.get("/projects", getProjects);

router.post(
  "/projects",
  authorize("ADMIN"),
  createProject
);

router.get(
  "/projects/:id",
  getProjectById
);

router.put(
  "/projects/:id",
  authorize("ADMIN"),
  updateProject
);

// ===============================
// BUILDINGS
// ===============================

router.post(
  "/buildings",
  authorize("ADMIN"),
  createBuilding
);

router.get(
  "/buildings",
  getBuildings
);

router.get(
  "/buildings/:id",
  getBuildingById
);

// ===============================
// UNITS
// ===============================

router.post(
  "/units",
  authorize("ADMIN"),
  createUnit
);

router.get(
  "/units",
  getUnits
);

router.get(
  "/units/:id",
  getUnitById
);

router.put(
  "/units/:id",
  authorize("ADMIN"),
  updateUnit
);

module.exports = router;