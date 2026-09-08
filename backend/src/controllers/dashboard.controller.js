const prisma = require("../lib/prisma");

const getDashboard = async (req, res) => {
  try {
    const isSales = req.user.role === "SALES";

    const leadWhere = isSales
      ? { assignedToId: req.user.userId }
      : {};

    const bookingWhere = isSales
      ? { bookedById: req.user.userId }
      : {};

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      siteVisits,
      interestedLeads,
      negotiationLeads,
      bookedLeads,
      lostLeads,
      totalBookings,
      availableUnits,
      bookedUnits,
      upcomingFollowUps,
      recentBookings,
    ] = await Promise.all([
      prisma.lead.count({
        where: leadWhere,
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "NEW",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "CONTACTED",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "SITE_VISIT",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "INTERESTED",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "NEGOTIATION",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "BOOKED",
        },
      }),

      prisma.lead.count({
        where: {
          ...leadWhere,
          stage: "LOST",
        },
      }),

      prisma.booking.count({
        where: {
          ...bookingWhere,
          status: "CONFIRMED",
        },
      }),

      prisma.unit.count({
        where: {
          status: "AVAILABLE",
        },
      }),

      prisma.unit.count({
        where: {
          status: "BOOKED",
        },
      }),

      prisma.lead.findMany({
        where: {
          ...leadWhere,
          followUpDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          followUpDate: "asc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          stage: true,
          followUpDate: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.booking.findMany({
        where: {
          ...bookingWhere,
          status: "CONFIRMED",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              unitNumber: true,
              type: true,
              price: true,
              building: {
                select: {
                  name: true,
                  project: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      summary: {
        totalLeads,
        newLeads,
        totalBookings,
        availableUnits,
        bookedUnits,
      },

      leadPipeline: {
        new: newLeads,
        contacted: contactedLeads,
        siteVisit: siteVisits,
        interested: interestedLeads,
        negotiation: negotiationLeads,
        booked: bookedLeads,
        lost: lostLeads,
      },

      upcomingFollowUps,

      recentBookings,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};