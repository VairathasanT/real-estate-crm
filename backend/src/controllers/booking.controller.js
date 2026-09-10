const prisma = require("../lib/prisma");

const createBooking = async (req, res) => {
  try {
    const { leadId, unitId } = req.body;

    // ---------------------------------------------------------
    // Validate input
    // ---------------------------------------------------------

    if (!leadId || !unitId) {
      return res.status(400).json({
        message: "leadId and unitId are required",
      });
    }

    const leadIdNumber = Number(leadId);
    const unitIdNumber = Number(unitId);

    if (
      !Number.isInteger(leadIdNumber) ||
      leadIdNumber <= 0 ||
      !Number.isInteger(unitIdNumber) ||
      unitIdNumber <= 0
    ) {
      return res.status(400).json({
        message: "leadId and unitId must be valid positive integers",
      });
    }

    // ---------------------------------------------------------
    // Check lead
    // ---------------------------------------------------------

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

    // Sales employees can only book their own assigned leads.
    if (
      req.user.role === "SALES" &&
      lead.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        message: "You can only book your assigned leads",
      });
    }

    // ---------------------------------------------------------
    // Check unit exists
    // ---------------------------------------------------------

    const unit = await prisma.unit.findUnique({
      where: {
        id: unitIdNumber,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found",
      });
    }

    // Early availability check.
    // The final availability check happens atomically
    // inside the transaction below.
    if (unit.status !== "AVAILABLE") {
      return res.status(409).json({
        message: "Unit is already booked or unavailable",
        code: "UNIT_NOT_AVAILABLE",
      });
    }

    // ---------------------------------------------------------
    // TRANSACTION
    // ---------------------------------------------------------

    const booking = await prisma.$transaction(async (tx) => {
      // -------------------------------------------------------
      // Check whether this lead already has a booking
      // INSIDE the transaction.
      // -------------------------------------------------------

      const existingLeadBooking = await tx.booking.findFirst({
        where: {
          leadId: leadIdNumber,
          status: "CONFIRMED",
        },
        select: {
          id: true,
        },
      });

      if (existingLeadBooking) {
        throw new Error("LEAD_ALREADY_BOOKED");
      }

      // -------------------------------------------------------
      // Atomically reserve the unit.
      //
      // Only a unit that is STILL AVAILABLE can be changed
      // to BOOKED.
      //
      // This prevents two users from booking the same unit
      // at the same time.
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // Create booking
      // -------------------------------------------------------

      const newBooking = await tx.booking.create({
        data: {
          leadId: leadIdNumber,
          unitId: unitIdNumber,
          bookedById: req.user.userId,
          status: "CONFIRMED",
        },

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
      });

      // -------------------------------------------------------
      // Update lead stage
      // -------------------------------------------------------

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

    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    // ---------------------------------------------------------
    // Known business errors
    // ---------------------------------------------------------

    if (error.message === "LEAD_ALREADY_BOOKED") {
      return res.status(409).json({
        message: "This lead already has a confirmed booking",
        code: "LEAD_ALREADY_BOOKED",
      });
    }

    if (error.message === "UNIT_ALREADY_BOOKED") {
      return res.status(409).json({
        message:
          "This unit was just booked by another user. Please select another available unit.",
        code: "UNIT_ALREADY_BOOKED",
      });
    }

    // ---------------------------------------------------------
    // Prisma unique constraint
    // ---------------------------------------------------------

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This unit already has a confirmed booking",
        code: "BOOKING_CONFLICT",
      });
    }

    // ---------------------------------------------------------
    // Unexpected error
    // ---------------------------------------------------------

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

// =========================================================
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

// =========================================================
// CANCEL BOOKING
// =========================================================

const cancelBooking = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

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

    // Already cancelled
    if (booking.status === "CANCELLED") {
      return res.status(400).json({
        message: "Booking is already cancelled",
      });
    }

    // Sales employees can only cancel their own bookings.
    // Admin can cancel any booking.
    if (
      req.user.role === "SALES" &&
      booking.bookedById !== req.user.userId
    ) {
      return res.status(403).json({
        message: "You can only cancel your own bookings",
      });
    }

    await prisma.$transaction(async (tx) => {
      // -----------------------------------------------------
      // 1. Confirm booking is still CONFIRMED
      // -----------------------------------------------------

      const updatedBooking =
        await tx.booking.updateMany({
          where: {
            id,
            status: "CONFIRMED",
          },
          data: {
            status: "CANCELLED",
          },
        });

      if (updatedBooking.count !== 1) {
        throw new Error("BOOKING_ALREADY_UPDATED");
      }

      // -----------------------------------------------------
      // 2. Release the unit
      // -----------------------------------------------------

      const updatedUnit =
        await tx.unit.updateMany({
          where: {
            id: booking.unitId,
            status: "BOOKED",
          },
          data: {
            status: "AVAILABLE",
          },
        });

      if (updatedUnit.count !== 1) {
        throw new Error("UNIT_NOT_BOOKED");
      }

      // -----------------------------------------------------
      // 3. Move lead back to Interested
      // -----------------------------------------------------

      await tx.lead.update({
        where: {
          id: booking.leadId,
        },
        data: {
          stage: "INTERESTED",
        },
      });
    });

    return res.json({
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    if (error.message === "BOOKING_ALREADY_UPDATED") {
      return res.status(409).json({
        message:
          "This booking has already been updated. Please refresh and try again.",
      });
    }

    if (error.message === "UNIT_NOT_BOOKED") {
      return res.status(409).json({
        message:
          "The booking could not be cancelled because the unit is no longer marked as booked.",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message:
          "The booking or related record could not be found.",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "Booking history conflict. Please refresh and try again.",
      });
    }

    return res.status(500).json({
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