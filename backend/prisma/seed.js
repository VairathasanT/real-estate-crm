const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const salesPassword = await bcrypt.hash("Sales@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@estateflow.com",
    },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@estateflow.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.upsert({
    where: {
      email: "sales@estateflow.com",
    },
    update: {},
    create: {
      name: "Sales Employee",
      email: "sales@estateflow.com",
      password: salesPassword,
      role: "SALES",
    },
  });

  console.log("Users created:");
  console.log(admin.email);
  console.log(sales.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });