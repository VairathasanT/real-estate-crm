const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// =========================================================
// LOGIN
// =========================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// =========================================================
// GET EMPLOYEES
// ADMIN ONLY
// =========================================================

const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        _count: {
          select: {
            assignedLeads: true,
            bookings: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

// =========================================================
// CREATE EMPLOYEE
// ADMIN ONLY
// =========================================================

const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "SALES",
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Employee name is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Employee email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (!["ADMIN", "SALES"].includes(role)) {
      return res.status(400).json({
        message: "Invalid employee role",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmployee =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingEmployee) {
      return res.status(409).json({
        message: "An employee with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const employee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,

        _count: {
          select: {
            assignedLeads: true,
            bookings: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    console.error("Create employee error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An employee with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create employee",
    });
  }
};

// =========================================================
// UPDATE EMPLOYEE
// ADMIN ONLY
// =========================================================

const updateEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const existingEmployee =
      await prisma.user.findUnique({
        where: {
          id: employeeId,
        },
      });

    if (!existingEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Employee name cannot be empty",
      });
    }

    if (email !== undefined && !email.trim()) {
      return res.status(400).json({
        message: "Employee email cannot be empty",
      });
    }

    if (
      role !== undefined &&
      !["ADMIN", "SALES"].includes(role)
    ) {
      return res.status(400).json({
        message: "Invalid employee role",
      });
    }

    // Prevent removing the final administrator.
    if (
      existingEmployee.role === "ADMIN" &&
      role === "SALES"
    ) {
      const adminCount = await prisma.user.count({
        where: {
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message:
            "The last administrator cannot be changed to Sales Employee",
        });
      }
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      const emailOwner =
        await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            NOT: {
              id: employeeId,
            },
          },
        });

      if (emailOwner) {
        return res.status(409).json({
          message:
            "Another employee is already using this email",
        });
      }

      updateData.email = normalizedEmail;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters",
        });
      }

      updateData.password =
        await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No changes were provided",
      });
    }

    const employee =
      await prisma.user.update({
        where: {
          id: employeeId,
        },

        data: updateData,

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,

          _count: {
            select: {
              assignedLeads: true,
              bookings: true,
            },
          },
        },
      });

    return res.json({
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Email is already in use",
      });
    }

    return res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

// =========================================================
// DELETE EMPLOYEE
// ADMIN ONLY
// =========================================================

const deleteEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    // Never allow an administrator to delete themselves.
    if (employeeId === req.user.userId) {
      return res.status(400).json({
        message:
          "You cannot delete your own account",
      });
    }

    const employee =
      await prisma.user.findUnique({
        where: {
          id: employeeId,
        },

        include: {
          _count: {
            select: {
              assignedLeads: true,
              bookings: true,
            },
          },
        },
      });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Prevent deleting the last administrator.
    if (employee.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          role: "ADMIN",
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message:
            "The last administrator cannot be deleted",
        });
      }
    }

    // Preserve CRM data integrity.
    if (
      employee._count.assignedLeads > 0 ||
      employee._count.bookings > 0
    ) {
      return res.status(400).json({
        message:
          "This employee has assigned leads or booking records and cannot be deleted. Reassign their leads first.",
      });
    }

    await prisma.user.delete({
      where: {
        id: employeeId,
      },
    });

    return res.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        message:
          "Employee cannot be deleted because CRM records are still linked to this account",
      });
    }

    return res.status(500).json({
      message: "Failed to delete employee",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  login,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};