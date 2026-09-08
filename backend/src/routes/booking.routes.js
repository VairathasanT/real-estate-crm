const express = require("express");

const {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/booking.controller");

const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", createBooking);

router.get("/", getBookings);

router.get("/:id", getBookingById);

router.put("/:id/cancel", cancelBooking);

module.exports = router;