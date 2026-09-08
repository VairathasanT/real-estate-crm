require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const leadRoutes = require("./routes/lead.routes");
const propertyRoutes = require("./routes/property.routes");
const bookingRoutes = require("./routes/booking.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "EstateFlow CRM API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database: "PostgreSQL",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`EstateFlow API running on http://localhost:${PORT}`);
});