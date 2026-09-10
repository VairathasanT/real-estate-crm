const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,

  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,

  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require("../controllers/property.controller");

const {
  authenticate,
  authorize,
} = require("../middleware/auth");

const router = express.Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// PROJECTS
// ============================================================

router.get("/projects", getProjects);

router.get(
  "/projects/:id",
  getProjectById
);

router.post(
  "/projects",
  authorize("ADMIN"),
  createProject
);

router.put(
  "/projects/:id",
  authorize("ADMIN"),
  updateProject
);

router.delete(
  "/projects/:id",
  authorize("ADMIN"),
  deleteProject
);

// ============================================================
// BUILDINGS
// ============================================================

router.get(
  "/buildings",
  getBuildings
);

router.get(
  "/buildings/:id",
  getBuildingById
);

router.post(
  "/buildings",
  authorize("ADMIN"),
  createBuilding
);

router.put(
  "/buildings/:id",
  authorize("ADMIN"),
  updateBuilding
);

router.delete(
  "/buildings/:id",
  authorize("ADMIN"),
  deleteBuilding
);

// ============================================================
// UNITS
// ============================================================

router.get(
  "/units",
  getUnits
);

router.get(
  "/units/:id",
  getUnitById
);

router.post(
  "/units",
  authorize("ADMIN"),
  createUnit
);

router.put(
  "/units/:id",
  authorize("ADMIN"),
  updateUnit
);

router.delete(
  "/units/:id",
  authorize("ADMIN"),
  deleteUnit
);

module.exports = router;