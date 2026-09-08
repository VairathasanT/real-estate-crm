const prisma = require("../lib/prisma");

// ============================================================
// CREATE LEAD
// ============================================================

const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      stage,
      notes,
      followUpDate,
      assignedToId,
    } = req.body;

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Lead name is required",
      });
    }

    // --------------------------------------------------------
    // Determine assignment
    //
    // ADMIN:
    // Can assign the lead to a SALES employee.
    //
    // SALES:
    // Automatically assigns the lead to themselves.
    // --------------------------------------------------------

    let finalAssignedToId = null;

    if (req.user.role === "SALES") {
      finalAssignedToId = Number(req.user.userId);

      if (!finalAssignedToId) {
        return res.status(401).json({
          message: "Invalid user information",
        });
      }
    }

    if (req.user.role === "ADMIN" && assignedToId) {
      finalAssignedToId = Number(assignedToId);
    }

    // --------------------------------------------------------
    // Validate assigned employee
    // --------------------------------------------------------

    if (finalAssignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: finalAssignedToId,
          role: "SALES",
        },
      });

      if (!employee) {
        return res.status(400).json({
          message: "Invalid sales employee",
        });
      }
    }

    // --------------------------------------------------------
    // Create lead
    // --------------------------------------------------------

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        stage: stage || "NEW",
        notes: notes?.trim() || null,

        followUpDate: followUpDate
          ? new Date(followUpDate)
          : null,

        assignedToId: finalAssignedToId,
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    return res.status(500).json({
      message: "Failed to create lead",
    });
  }
};

// ============================================================
// GET ALL LEADS
// ============================================================

const getLeads = async (req, res) => {
  try {
    const {
      search,
      stage,
      assignedToId,
    } = req.query;

    const where = {};

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // --------------------------------------------------------
    // Stage filter
    // --------------------------------------------------------

    if (stage) {
      where.stage = stage;
    }

    // --------------------------------------------------------
    // Assignment filter
    // --------------------------------------------------------

    if (assignedToId) {
      where.assignedToId = Number(assignedToId);
    }

    // --------------------------------------------------------
    // SALES employees can only see their own leads
    // --------------------------------------------------------

    if (req.user.role === "SALES") {
      where.assignedToId = Number(req.user.userId);
    }

    // --------------------------------------------------------
    // Fetch leads
    // --------------------------------------------------------

    const leads = await prisma.lead.findMany({
      where,

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    return res.status(500).json({
      message: "Failed to fetch leads",
    });
  }
};

// ============================================================
// GET LEAD BY ID
// ============================================================

const getLeadById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: {
        id,
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        bookings: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // SALES can only view their own leads

    if (
      req.user.role === "SALES" &&
      lead.assignedToId !== Number(req.user.userId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.json(lead);
  } catch (error) {
    console.error("Get lead error:", error);

    return res.status(500).json({
      message: "Failed to fetch lead",
    });
  }
};

// ============================================================
// UPDATE LEAD
// ============================================================

const updateLead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    // --------------------------------------------------------
    // Find existing lead
    // --------------------------------------------------------

    const existingLead = await prisma.lead.findUnique({
      where: {
        id,
      },
    });

    if (!existingLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // --------------------------------------------------------
    // SALES can only update their own leads
    // --------------------------------------------------------

    if (
      req.user.role === "SALES" &&
      existingLead.assignedToId !== Number(req.user.userId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      name,
      email,
      phone,
      stage,
      notes,
      followUpDate,
      assignedToId,
    } = req.body;

    // --------------------------------------------------------
    // Only ADMIN can change assignment
    // --------------------------------------------------------

    if (
      assignedToId !== undefined &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Only admin can assign leads",
      });
    }

    // --------------------------------------------------------
    // Validate new assignment
    // --------------------------------------------------------

    if (assignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: Number(assignedToId),
          role: "SALES",
        },
      });

      if (!employee) {
        return res.status(400).json({
          message: "Invalid sales employee",
        });
      }
    }

    // --------------------------------------------------------
    // Update lead
    // --------------------------------------------------------

    const lead = await prisma.lead.update({
      where: {
        id,
      },

      data: {
        ...(name !== undefined && {
          name: name.trim(),
        }),

        ...(email !== undefined && {
          email: email?.trim() || null,
        }),

        ...(phone !== undefined && {
          phone: phone?.trim() || null,
        }),

        ...(stage !== undefined && {
          stage,
        }),

        ...(notes !== undefined && {
          notes: notes?.trim() || null,
        }),

        ...(followUpDate !== undefined && {
          followUpDate: followUpDate
            ? new Date(followUpDate)
            : null,
        }),

        ...(assignedToId !== undefined && {
          assignedToId: assignedToId
            ? Number(assignedToId)
            : null,
        }),
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);

    return res.status(500).json({
      message: "Failed to update lead",
    });
  }
};

// ============================================================
// DELETE LEAD
// ============================================================

const deleteLead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Invalid lead ID",
      });
    }

    // --------------------------------------------------------
    // Only ADMIN can delete leads
    // --------------------------------------------------------

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can delete leads",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: {
        id,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    await prisma.lead.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);

    return res.status(500).json({
      message: "Failed to delete lead",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
};