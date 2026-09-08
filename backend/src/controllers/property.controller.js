const prisma = require("../lib/prisma");

// ===============================
// PROJECTS
// ===============================

const createProject = async (req, res) => {
  try {
    const { name, location, description } = req.body;

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

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
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

    res.json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};


const getProjectById = async (req, res) => {
  try {
    const id = Number(req.params.id);

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

    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};


const updateProject = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const { name, location, description } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      message: "Failed to update project",
    });
  }
};


// ===============================
// BUILDINGS
// ===============================

const createBuilding = async (req, res) => {
  try {
    const { name, projectId } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({
        message: "Building name and projectId are required",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
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
        projectId: Number(projectId),
      },
      include: {
        project: true,
      },
    });

    res.status(201).json({
      message: "Building created successfully",
      building,
    });
  } catch (error) {
    console.error("Create building error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Building with this name already exists in this project",
      });
    }

    res.status(500).json({
      message: "Failed to create building",
    });
  }
};


const getBuildings = async (req, res) => {
  try {
    const { projectId } = req.query;

    const buildings = await prisma.building.findMany({
      where: projectId
        ? {
            projectId: Number(projectId),
          }
        : undefined,
      include: {
        project: true,
        units: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      count: buildings.length,
      buildings,
    });
  } catch (error) {
    console.error("Get buildings error:", error);

    res.status(500).json({
      message: "Failed to fetch buildings",
    });
  }
};


const getBuildingById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const building = await prisma.building.findUnique({
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

    res.json(building);
  } catch (error) {
    console.error("Get building error:", error);

    res.status(500).json({
      message: "Failed to fetch building",
    });
  }
};


// ===============================
// UNITS
// ===============================

const createUnit = async (req, res) => {
  try {
    const {
      unitNumber,
      type,
      price,
      status,
      buildingId,
    } = req.body;

    if (!unitNumber || !type || price === undefined || !buildingId) {
      return res.status(400).json({
        message: "unitNumber, type, price and buildingId are required",
      });
    }

    const building = await prisma.building.findUnique({
      where: {
        id: Number(buildingId),
      },
    });

    if (!building) {
      return res.status(404).json({
        message: "Building not found",
      });
    }

    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        type,
        price: Number(price),
        status: status || "AVAILABLE",
        buildingId: Number(buildingId),
      },
      include: {
        building: {
          include: {
            project: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Unit created successfully",
      unit,
    });
  } catch (error) {
    console.error("Create unit error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Unit with this number already exists in this building",
      });
    }

    res.status(500).json({
      message: "Failed to create unit",
    });
  }
};


const getUnits = async (req, res) => {
  try {
    const { status, type, buildingId } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (buildingId) {
      where.buildingId = Number(buildingId);
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

    res.json({
      count: units.length,
      units,
    });
  } catch (error) {
    console.error("Get units error:", error);

    res.status(500).json({
      message: "Failed to fetch units",
    });
  }
};


const getUnitById = async (req, res) => {
  try {
    const id = Number(req.params.id);

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

    res.json(unit);
  } catch (error) {
    console.error("Get unit error:", error);

    res.status(500).json({
      message: "Failed to fetch unit",
    });
  }
};


const updateUnit = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingUnit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existingUnit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    const { unitNumber, type, price, status } = req.body;

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        ...(unitNumber !== undefined && { unitNumber }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: Number(price) }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({
      message: "Unit updated successfully",
      unit,
    });
  } catch (error) {
    console.error("Update unit error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Unit number already exists in this building",
      });
    }

    res.status(500).json({
      message: "Failed to update unit",
    });
  }
};


module.exports = {
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
};