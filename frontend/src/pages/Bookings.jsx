import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

const initialBookingForm = {
  leadId: "",
  unitId: "",
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [confirmationBookingId, setConfirmationBookingId] = useState(null);

  const [bookingForm, setBookingForm] =
    useState(initialBookingForm);

  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  const loadBookings = async () => {
    const response = await api.get("/bookings");

    const data = response.data;

    setBookings(
      Array.isArray(data)
        ? data
        : data?.bookings || []
    );
  };

  // =========================================================
  // LOAD LEADS
  // =========================================================

  const loadLeads = async () => {
    const response = await api.get("/leads");

    const data = response.data;

    setLeads(
      Array.isArray(data)
        ? data
        : data?.leads || []
    );
  };

  // =========================================================
  // LOAD UNITS
  // =========================================================

  const loadUnits = async () => {
    const response = await api.get("/units");

    const data = response.data;

    const allUnits = Array.isArray(data)
      ? data
      : data?.units || [];

    setUnits(allUnits);
  };

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadBookings(),
        loadLeads(),
        loadUnits(),
      ]);
    } catch (err) {
      console.error("LOAD BOOKINGS ERROR:", err);

      setError(getApiErrorMessage(err, "Unable to load bookings."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // AVAILABLE UNITS
  // =========================================================

  const availableUnits = useMemo(() => {
    return units.filter(
      (unit) => unit.status === "AVAILABLE"
    );
  }, [units]);

  // =========================================================
  // BOOKING COUNTS
  // =========================================================

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED"
  ).length;

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBookingForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================================
  // OPEN MODAL
  // =========================================================

  const openModal = () => {
    setBookingForm({
      ...initialBookingForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setBookingForm({
      ...initialBookingForm,
    });

    setError("");
  };

  // =========================================================
  // CREATE BOOKING
  // =========================================================

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (!bookingForm.leadId) {
      setError("Please select a lead.");
      return;
    }

    if (!bookingForm.unitId) {
      setError("Please select an available unit.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/bookings", {
        leadId: Number(bookingForm.leadId),
        unitId: Number(bookingForm.unitId),
      });

      setSuccess("Booking created successfully.");

      setBookingForm({
        ...initialBookingForm,
      });

      setShowModal(false);

      await loadData();
    } catch (err) {
      if (err.response?.status === 409) {
        setError("This unit is no longer available. It may have just been booked by another user.");
        setBookingForm((current) => ({ ...current, unitId: "" }));
        await Promise.all([loadBookings(), loadUnits()]);
      } else {
        setError(getApiErrorMessage(err, "Unable to create booking."));
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      setError("");
      setSuccess("");

      await api.put(
        `/bookings/${bookingId}/cancel`
      );

      setSuccess("Booking cancelled successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "This booking has already been updated. Refresh and try again."
          : getApiErrorMessage(err, "Unable to cancel booking.")
      );
    } finally {
      setCancellingId(null);
      setConfirmationBookingId(null);
    }
  };

  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined
    ) {
      return "₹0";
    }

    return Number(price).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const statusClass = (status) => {
    return `booking-status status-${(
      status || "CONFIRMED"
    ).toLowerCase()}`;
  };

  const statusLabel = (status) =>
    (status || "CONFIRMED")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page-container bookings-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Bookings</h1>

          <p>
            Manage property bookings and reservations
          </p>
        </div>

        <div className="page-header-actions">

          <button
            type="button"
            className="refresh-button"
            onClick={loadData}
            disabled={loading || saving}
          >
            <RefreshCw size={17} />

            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openModal}
            disabled={
              loading ||
              availableUnits.length === 0
            }
          >
            <Plus size={17} />

            Create Booking
          </button>

        </div>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <CalendarCheck size={22} />
          </div>

          <div>
            <span>Total Bookings</span>
            <strong>{bookings.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Confirmed</span>
            <strong>
              {confirmedBookings}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Cancelled</span>
            <strong>
              {cancelledBookings}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Available Units</span>
            <strong>
              {availableUnits.length}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          BOOKINGS TABLE
      ====================================================== */}

      <div className="section-header">

        <div>
          <h2>All Bookings</h2>

          <p>
            Track confirmed and cancelled bookings
          </p>
        </div>

      </div>

      {loading ? (

        <div className="dashboard-card empty-state">
          <RefreshCw size={36} />

          <h3>Loading bookings...</h3>

          <p>
            Please wait while we load your bookings.
          </p>
        </div>

      ) : bookings.length === 0 ? (

        <div className="dashboard-card empty-state">
          <CalendarCheck size={36} />

          <h3>No bookings yet</h3>

          <p>
            Create your first booking using the
            button above.
          </p>
          <button type="button" className="primary-button" onClick={openModal} disabled={availableUnits.length === 0}>
            <Plus size={17} />
            Create Booking
          </button>
        </div>

      ) : (

        <div className="dashboard-card">

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Project</th>
                  <th>Building</th>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Booked By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {bookings.map((booking) => {

                  const unit = booking.unit;
                  const building =
                    unit?.building;
                  const project =
                    building?.project;

                  return (
                    <tr key={booking.id}>

                      <td>
                        <strong>
                          {booking.lead?.name ||
                            "-"}
                        </strong>

                        {booking.lead?.phone && (
                          <small className="table-secondary">
                            {booking.lead.phone}
                          </small>
                        )}
                      </td>

                      <td>
                        {project?.name || "-"}
                      </td>

                      <td>
                        {building?.name || "-"}
                      </td>

                      <td>
                        <strong>
                          {unit?.unitNumber ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {unit?.type || "-"}
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            unit?.price
                          )}
                        </strong>
                      </td>

                      <td>
                        {booking.bookedBy?.name ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          booking.bookedAt ||
                            booking.createdAt
                        )}
                      </td>

                      <td>
                        <span
                          className={statusClass(
                            booking.status
                          )}
                        >
                          {statusLabel(booking.status)}
                        </span>
                      </td>

                      <td>

                        {booking.status ===
                          "CONFIRMED" && (
                          <button
                            type="button"
                            className="table-action danger"
                            onClick={() => setConfirmationBookingId(booking.id)}
                            disabled={
                              cancellingId ===
                              booking.id
                            }
                          >
                            <XCircle
                              size={16}
                            />

                            {cancellingId ===
                            booking.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </button>
                        )}

                        {booking.status ===
                          "CANCELLED" && (
                          <span className="muted-text">
                            —
                          </span>
                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* =====================================================
          CREATE BOOKING MODAL
      ====================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>Create Booking</h2>

                <p>
                  Connect a lead with an available
                  property unit
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close booking form"
              >
                <X size={20} />
              </button>

            </div>

            {error && (
              <div className="error-message modal-error">
                {error}
              </div>
            )}

            <form
              className="lead-form"
              onSubmit={handleCreateBooking}
            >

              {/* LEAD */}

              <div className="form-group">

                <label htmlFor="booking-lead">
                  Lead *
                </label>

                <select
                  id="booking-lead"
                  name="leadId"
                  value={bookingForm.leadId}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select lead
                  </option>

                  {leads.map((lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {lead.name}
                      {lead.phone
                        ? ` - ${lead.phone}`
                        : ""}
                    </option>
                  ))}

                </select>

              </div>

              {/* UNIT */}

              <div className="form-group">

                <label htmlFor="booking-unit">
                  Available Unit *
                </label>

                <select
                  id="booking-unit"
                  name="unitId"
                  value={bookingForm.unitId}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select available unit
                  </option>

                  {availableUnits.map(
                    (unit) => (
                      <option
                        key={unit.id}
                        value={unit.id}
                      >
                        {unit.building?.project
                          ?.name
                          ? `${unit.building.project.name} - `
                          : ""}
                        {unit.building?.name
                          ? `${unit.building.name} - `
                          : ""}
                        {unit.unitNumber} -{" "}
                        {unit.type} -{" "}
                        {formatPrice(unit.price)}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* SELECTED UNIT PREVIEW */}

              {bookingForm.unitId && (
                <div className="booking-preview">

                  {(() => {
                    const selectedUnit =
                      units.find(
                        (unit) =>
                          String(unit.id) ===
                          String(
                            bookingForm.unitId
                          )
                      );

                    if (!selectedUnit) {
                      return null;
                    }

                    return (
                      <>
                        <div>
                          <span>
                            Property
                          </span>

                          <strong>
                            {selectedUnit
                              .building
                              ?.project?.name ||
                              "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Unit
                          </span>

                          <strong>
                            {selectedUnit.unitNumber}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Price
                          </span>

                          <strong>
                            {formatPrice(
                              selectedUnit.price
                            )}
                          </strong>
                        </div>
                      </>
                    );
                  })()}

                </div>
              )}

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    availableUnits.length === 0
                  }
                >
                  {saving
                    ? "Creating..."
                    : "Confirm Booking"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      <ConfirmDialog
        isOpen={confirmationBookingId !== null}
        title="Cancel this booking?"
        message="The unit will become available again."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        isDestructive
        isPending={cancellingId !== null}
        onCancel={() => {
          if (cancellingId === null) setConfirmationBookingId(null);
        }}
        onConfirm={() => handleCancelBooking(confirmationBookingId)}
      />

    </div>
  );
}