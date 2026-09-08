const prisma = require("../lib/prisma");

const createBooking = async (req, res) => {
  try {
    const { leadId, unitId } = req.body;

    if (!leadId || !unitId) {
      return res.status(400).json({
        message: "leadId and unitId are required",
      });
    }

    const leadIdNumber = Number(leadId);
    const unitIdNumber = Number(unitId);

    // Check lead
    const lead = await prisma.lead.findUnique({
      where: {
        id: leadIdNumber,
      },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Sales employees can only book their own leads
    if (
      req.user.role === "SALES" &&
      lead.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "You can only book your assigned leads",
      });
    }

    // Check unit exists
    const unit = await prisma.unit.findUnique({
      where: {
        id: unitIdNumber,
      },
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    // Quick availability check
    if (unit.status !== "AVAILABLE") {
      return res.status(409).json({
        message: "Unit is already booked or unavailable",
      });
    }

    // Prevent booking the same lead again
    const existingLeadBooking = await prisma.booking.findFirst({
      where: {
        leadId: leadIdNumber,
        status: "CONFIRMED",
      },
    });

    if (existingLeadBooking) {
      return res.status(409).json({
        message: "This lead already has a confirmed booking",
      });
    }

    /*
     * IMPORTANT:
     * Atomically change AVAILABLE → BOOKED.
     *
     * updateMany() with a status condition prevents two
     * concurrent requests from successfully reserving
     * the same unit.
     */
    const booking = await prisma.$transaction(async (tx) => {
      const updatedUnit = await tx.unit.updateMany({
        where: {
          id: unitIdNumber,
          status: "AVAILABLE",
        },
        data: {
          status: "BOOKED",
        },
      });

      if (updatedUnit.count !== 1) {
        throw new Error("UNIT_ALREADY_BOOKED");
      }

      const newBooking = await tx.booking.create({
        data: {
          leadId: leadIdNumber,
          unitId: unitIdNumber,
          bookedById: req.user.userId,
          status: "CONFIRMED",
        },
        include: {
          lead: true,
          unit: {
            include: {
              building: {
                include: {
                  project: true,
                },
              },
            },
          },
          bookedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Update lead stage
      await tx.lead.update({
        where: {
          id: leadIdNumber,
        },
        data: {
          stage: "BOOKED",
        },
      });

      return newBooking;
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    if (error.message === "UNIT_ALREADY_BOOKED") {
      return res.status(409).json({
        message: "Unit was just booked by another user",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This unit already has a confirmed booking",
      });
    }

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};


// Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where:
        req.user.role === "SALES"
          ? {
              bookedById: req.user.userId,
            }
          : undefined,

      include: {
        lead: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        unit: {
          include: {
            building: {
              include: {
                project: true,
              },
            },
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);

    res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
};


// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        lead: true,
        unit: {
          include: {
            building: {
              include: {
                project: true,
              },
            },
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (
      req.user.role === "SALES" &&
      booking.bookedById !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json(booking);
  } catch (error) {
    console.error("Get booking error:", error);

    res.status(500).json({
      message: "Failed to fetch booking",
    });
  }
};


// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: {
        id,
      },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({
        message: "Booking is already cancelled",
      });
    }

    if (
      req.user.role === "SALES" &&
      booking.bookedById !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: {
          id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      await tx.unit.update({
        where: {
          id: booking.unitId,
        },
        data: {
          status: "AVAILABLE",
        },
      });

      await tx.lead.update({
        where: {
          id: booking.leadId,
        },
        data: {
          stage: "INTERESTED",
        },
      });
    });

    res.json({
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};


module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
};