// 




const prisma = require("../lib/prisma");

// ============================================================
// HELPERS
// ============================================================

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const cleanString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || null;
};

const parsePrice = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return price;
};

// ============================================================
// PROJECTS
// ============================================================

const createProject = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const location =
      typeof req.body.location === "string"
        ? req.body.location.trim()
        : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (!name || !location) {
      return res.status(400).json({
        message: "Project name and location are required",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        location,
        description: description || null,
      },
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Failed to create project",
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        buildings: {
          include: {
            units: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        buildings: {
          include: {
            units: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.json(project);
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const existingProject =
      await prisma.project.findUnique({
        where: { id },
      });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          message: "Project name cannot be empty",
        });
      }

      data.name = req.body.name.trim();
    }

    if (req.body.location !== undefined) {
      if (
        typeof req.body.location !== "string" ||
        !req.body.location.trim()
      ) {
        return res.status(400).json({
          message: "Project location cannot be empty",
        });
      }

      data.location = req.body.location.trim();
    }

    if (req.body.description !== undefined) {
      data.description = cleanString(
        req.body.description
      );
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "No valid project fields provided",
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      message: "Failed to update project",
    });
  }
};

// ============================================================
// DELETE PROJECT
// ============================================================

const deleteProject = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid project ID",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        buildings: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.buildings.length > 0) {
      return res.status(409).json({
        message:
          "This project cannot be deleted because it contains buildings. Delete the buildings first.",
        code: "PROJECT_HAS_BUILDINGS",
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.json({
      message: "Project deleted successfully",
      projectId: id,
    });
  } catch (error) {
    console.error("Delete project error:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(500).json({
      message: "Failed to delete project",
    });
  }
};


// ============================================================
// BUILDINGS
// ============================================================

const createBuilding = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const projectId = parseId(req.body.projectId);

    if (!name || !projectId) {
      return res.status(400).json({
        message:
          "Building name and projectId are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const building = await prisma.building.create({
      data: {
        name,
        projectId,
      },
      include: {
        project: true,
      },
    });

    return res.status(201).json({
      message: "Building created successfully",
      building,
    });
  } catch (error) {
    console.error("Create building error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Building with this name already exists in this project",
      });
    }

    return res.status(500).json({
      message: "Failed to create building",
    });
  }
};

const getBuildings = async (req, res) => {
  try {
    const { projectId } = req.query;

    let where;

    if (projectId !== undefined) {
      const parsedProjectId = parseId(projectId);

      if (!parsedProjectId) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      where = {
        projectId: parsedProjectId,
      };
    }

    const buildings =
      await prisma.building.findMany({
        where,
        include: {
          project: true,
          units: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      count: buildings.length,
      buildings,
    });
  } catch (error) {
    console.error("Get buildings error:", error);

    return res.status(500).json({
      message: "Failed to fetch buildings",
    });
  }
};

const getBuildingById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid building ID",
      });
    }

    const building =
      await prisma.building.findUnique({
        where: { id },
        include: {
          project: true,
          units: true,
        },
      });

    if (!building) {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    return res.json(building);
  } catch (error) {
    console.error("Get building error:", error);

    return res.status(500).json({
      message: "Failed to fetch building",
    });
  }
};

// ============================================================
// UPDATE BUILDING
// ============================================================

const updateBuilding = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid building ID",
      });
    }

    const existingBuilding =
      await prisma.building.findUnique({
        where: { id },
      });

    if (!existingBuilding) {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          message: "Building name cannot be empty",
        });
      }

      data.name = req.body.name.trim();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "No valid building fields provided",
      });
    }

    const building =
      await prisma.building.update({
        where: { id },
        data,
        include: {
          project: true,
          units: true,
        },
      });

    return res.json({
      message: "Building updated successfully",
      building,
    });
  } catch (error) {
    console.error("Update building error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Building with this name already exists in this project",
      });
    }

    return res.status(500).json({
      message: "Failed to update building",
    });
  }
};

// ============================================================
// DELETE BUILDING
// ============================================================

const deleteBuilding = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid building ID",
      });
    }

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        units: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!building) {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    if (building.units.length > 0) {
      return res.status(409).json({
        message:
          "This building cannot be deleted because it contains units. Delete the units first.",
        code: "BUILDING_HAS_UNITS",
      });
    }

    await prisma.building.delete({
      where: { id },
    });

    return res.json({
      message: "Building deleted successfully",
      buildingId: id,
    });
  } catch (error) {
    console.error("Delete building error:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    return res.status(500).json({
      message: "Failed to delete building",
    });
  }
};

// ============================================================
// UNITS
// ============================================================

const createUnit = async (req, res) => {
  try {
    const unitNumber =
      typeof req.body.unitNumber === "string"
        ? req.body.unitNumber.trim()
        : "";

    const type =
      typeof req.body.type === "string"
        ? req.body.type.trim()
        : "";

    const buildingId = parseId(
      req.body.buildingId
    );

    const price = parsePrice(req.body.price);

    if (
      !unitNumber ||
      !type ||
      price === null ||
      !buildingId
    ) {
      return res.status(400).json({
        message:
          "unitNumber, type, valid price and buildingId are required",
      });
    }

    const building =
      await prisma.building.findUnique({
        where: {
          id: buildingId,
        },
      });

    if (!building) {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    /*
     * New units always start as AVAILABLE.
     *
     * A unit becomes BOOKED through the booking
     * transaction and can become AVAILABLE again
     * through booking cancellation.
     *
     * This prevents creating fake BOOKED/SOLD records
     * without a corresponding business transaction.
     */
    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        type,
        price,
        status: "AVAILABLE",
        buildingId,
      },
      include: {
        building: {
          include: {
            project: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Unit created successfully",
      unit,
    });
  } catch (error) {
    console.error("Create unit error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Unit with this number already exists in this building",
      });
    }

    return res.status(500).json({
      message: "Failed to create unit",
    });
  }
};

const getUnits = async (req, res) => {
  try {
    const {
      status,
      type,
      buildingId,
    } = req.query;

    const where = {};

    if (status) {
      const allowedStatuses = [
        "AVAILABLE",
        "BOOKED",
        "SOLD",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid unit status",
        });
      }

      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (buildingId) {
      const parsedBuildingId =
        parseId(buildingId);

      if (!parsedBuildingId) {
        return res.status(400).json({
          message: "Invalid building ID",
        });
      }

      where.buildingId = parsedBuildingId;
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        building: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        unitNumber: "asc",
      },
    });

    return res.json({
      count: units.length,
      units,
    });
  } catch (error) {
    console.error("Get units error:", error);

    return res.status(500).json({
      message: "Failed to fetch units",
    });
  }
};

const getUnitById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid unit ID",
      });
    }

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        building: {
          include: {
            project: true,
          },
        },
        bookings: true,
      },
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    return res.json(unit);
  } catch (error) {
    console.error("Get unit error:", error);

    return res.status(500).json({
      message: "Failed to fetch unit",
    });
  }
};

// ============================================================
// UPDATE UNIT
// ============================================================

const updateUnit = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid unit ID",
      });
    }

    const existingUnit =
      await prisma.unit.findUnique({
        where: { id },
      });

    if (!existingUnit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    const data = {};

    if (req.body.unitNumber !== undefined) {
      if (
        typeof req.body.unitNumber !== "string" ||
        !req.body.unitNumber.trim()
      ) {
        return res.status(400).json({
          message: "Unit number cannot be empty",
        });
      }

      data.unitNumber =
        req.body.unitNumber.trim();
    }

    if (req.body.type !== undefined) {
      if (
        typeof req.body.type !== "string" ||
        !req.body.type.trim()
      ) {
        return res.status(400).json({
          message: "Unit type cannot be empty",
        });
      }

      data.type = req.body.type.trim();
    }

    if (req.body.price !== undefined) {
      const price = parsePrice(
        req.body.price
      );

      if (price === null) {
        return res.status(400).json({
          message:
            "Unit price must be a valid non-negative number",
        });
      }

      data.price = price;
    }


    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message:
          "No editable unit fields were provided",
      });
    }

    const unit = await prisma.unit.update({
      where: { id },
      data,
      include: {
        building: {
          include: {
            project: true,
          },
        },
      },
    });

    return res.json({
      message: "Unit updated successfully",
      unit,
    });
  } catch (error) {
    console.error("Update unit error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Unit number already exists in this building",
      });
    }

    return res.status(500).json({
      message: "Failed to update unit",
    });
  }
};

// ============================================================
// DELETE UNIT
// ============================================================

const deleteUnit = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid unit ID",
      });
    }

    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        bookings: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    if (unit.status === "BOOKED") {
      return res.status(409).json({
        message:
          "This unit cannot be deleted because it is currently booked. Cancel the booking first.",
        code: "UNIT_IS_BOOKED",
      });
    }

    if (unit.bookings.length > 0) {
      return res.status(409).json({
        message:
          "This unit cannot be deleted because it has booking history.",
        code: "UNIT_HAS_BOOKING_HISTORY",
      });
    }

    await prisma.unit.delete({
      where: { id },
    });

    return res.json({
      message: "Unit deleted successfully",
      unitId: id,
    });
  } catch (error) {
    console.error("Delete unit error:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    return res.status(500).json({
      message: "Failed to delete unit",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
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
};
