import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";

const stages = [
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "INTERESTED",
  "NEGOTIATION",
  "BOOKED",
  "LOST",
];

const initialForm = {
  name: "",
  email: "",
  phone: "",
  stage: "NEW",
  notes: "",
  followUpDate: "",
  assignedToId: "",
};

export default function Leads() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(() => searchParams.get("stage") || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [selectedLead, setSelectedLead] = useState(null);
  const [confirmationLead, setConfirmationLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(false);

  const [form, setForm] = useState(initialForm);

  // =====================================================
  // LOAD LEADS
  // =====================================================

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError("");
      setFieldErrors({});

      const response = await api.get("/leads");

      const data = response.data;

      if (Array.isArray(data)) {
        setLeads(data);
      } else if (Array.isArray(data?.leads)) {
        setLeads(data.leads);
      } else {
        setLeads([]);
        setError("Unexpected leads response.");
      }
    } catch (err) {
      console.error("GET LEADS ERROR:", err);

      setLeads([]);

      setError(getApiErrorMessage(err, "Unable to load leads."));
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadLeads();

    if (isAdmin) {
      api.get("/auth/employees")
        .then((response) => {
          const data = response.data;
          const list = Array.isArray(data)
            ? data
            : data?.employees || [];

          setEmployees(
            list.filter((employee) => employee.role === "SALES")
          );
        })
        .catch((err) => {
          setError(
            getApiErrorMessage(
              err,
              "Unable to load sales employees."
            )
          );
        });
    }
  }, [isAdmin]);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  // =====================================================
  // DATE FORMAT FOR DATETIME-LOCAL
  // =====================================================

  const convertToDateTimeLocal = (date) => {
    if (!date) return "";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      value.getDate()
    ).padStart(2, "0");

    const hours = String(
      value.getHours()
    ).padStart(2, "0");

    const minutes = String(
      value.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const openCreateModal = () => {
    setModalMode("create");

    setSelectedLead(null);

    setForm({
      ...initialForm,
    });

    setError("");
    setFieldErrors({});

    setShowModal(true);
  };

  // =====================================================
  // OPEN VIEW MODAL
  // =====================================================

  const openViewModal = async (lead) => {
    try {
      setError("");

      const response = await api.get(
        `/leads/${lead.id}`
      );

      setSelectedLead(response.data);

      setModalMode("view");

      setShowModal(true);
    } catch (err) {
      console.error(
        "GET LEAD ERROR:",
        err
      );

      setError(getApiErrorMessage(err, "Unable to load lead details."));
    }
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = async (lead) => {
    try {
      setError("");

      const response = await api.get(
        `/leads/${lead.id}`
      );

      const data = response.data;

      setSelectedLead(data);

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        stage: data.stage || "NEW",
        notes: data.notes || "",
        followUpDate:
          convertToDateTimeLocal(
            data.followUpDate
          ),
        assignedToId: data.assignedToId
          ? String(data.assignedToId)
          : "",
      });

      setModalMode("edit");

      setShowModal(true);
    } catch (err) {
      console.error(
        "GET LEAD FOR EDIT ERROR:",
        err
      );

      setError(getApiErrorMessage(err, "Unable to load lead."));
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = useCallback(() => {
    if (saving) return;

    setShowModal(false);

    setSelectedLead(null);

    setModalMode("create");

    setForm({
      ...initialForm,
    });
    setFieldErrors({});
  }, [saving]);

  useEffect(() => {
    if (!showModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, saving, showModal]);

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    const email = form.email.trim();
    const phone = form.phone.trim();
    const followUpDate = form.followUpDate
      ? new Date(form.followUpDate)
      : null;

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (phone && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    if (followUpDate && Number.isNaN(followUpDate.getTime())) {
      nextErrors.followUpDate = "Enter a valid follow-up date.";
    } else if (
      modalMode === "create" &&
      followUpDate &&
      followUpDate.getTime() < Date.now()
    ) {
      nextErrors.followUpDate = "Follow-up date cannot be in the past.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const payload = {
        name: form.name.trim(),
        email:
          form.email.trim() || null,
        phone:
          form.phone.trim() || null,
        stage: form.stage,
        notes:
          form.notes.trim() || null,

        followUpDate:
          form.followUpDate
            ? new Date(
                form.followUpDate
              ).toISOString()
            : null,
        ...(isAdmin && {
          assignedToId: form.assignedToId
            ? Number(form.assignedToId)
            : null,
        }),
      };

      // -------------------------------------------------
      // CREATE
      // -------------------------------------------------

      if (modalMode === "create") {
        await api.post(
          "/leads",
          payload
        );

      }

      // -------------------------------------------------
      // UPDATE
      // -------------------------------------------------

      if (
        modalMode === "edit" &&
        selectedLead
      ) {
        await api.put(
          `/leads/${selectedLead.id}`,
          payload
        );

      }

      // Close
      setShowModal(false);

      setSelectedLead(null);

      setForm({
        ...initialForm,
      });

      // Reload database data
      await loadLeads();
      setSuccess(modalMode === "create" ? "Lead created successfully." : "Lead updated successfully.");
      window.setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      console.error(
        "SAVE LEAD ERROR:",
        err.response?.data || err
      );

      setError(getApiErrorMessage(err, "Unable to save lead."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lead) => {
    try {
      setDeletingLead(true);
      setError("");
      await api.delete(`/leads/${lead.id}`);
      await loadLeads();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete lead."));
    } finally {
      setDeletingLead(false);
      setConfirmationLead(null);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredLeads = leads.filter(
    (lead) => {
      const text = [
        lead.name,
        lead.email,
        lead.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search.trim().toLowerCase()) &&
        (!stageFilter || lead.stage === stageFilter);
    }
  );

  const hasSearch = search.trim().length > 0;
  const hasStageFilter = Boolean(stageFilter);

  // =====================================================
  // FORMAT STAGE
  // =====================================================

  const formatStage = (stage) => {
    if (!stage) return "-";

    return stage
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const value = new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return "-";
    }

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getFollowUpStatus = (date) => {
    if (!date) return null;

    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return null;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const dayDifference = Math.round((startOfDate - startOfToday) / 86400000);
    const formattedDate = formatDate(date);

    if (dayDifference < 0) return { date: formattedDate, status: "Overdue", tone: "overdue" };
    if (dayDifference === 0) return { date: formattedDate, status: "Today", tone: "today" };
    if (dayDifference === 1) return { date: formattedDate, status: "Tomorrow", tone: "tomorrow" };
    return { date: formattedDate, status: "Upcoming", tone: "upcoming" };
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="page-container">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-header">

        <div>
          <h1>Leads</h1>

          <p>
            Manage and track your sales leads
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Lead
        </button>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="leads-toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search leads..."
            aria-label="Search leads by name, email, or phone"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          className="leads-stage-filter"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          aria-label="Filter leads by stage"
        >
          <option value="">All stages</option>
          {stages.map((stage) => <option key={stage} value={stage}>{formatStage(stage)}</option>)}
        </select>

        <button
          type="button"
          className="refresh-button"
          onClick={loadLeads}
          disabled={loading}
        >
          <RefreshCw size={17} />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" role="status">
          {success}
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="dashboard-card leads-card">

        {loading ? (

          <div className="leads-loading" aria-label="Loading leads">
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
          </div>

        ) : filteredLeads.length === 0 ? (

          <div className="empty-state">

            <h3>
              {leads.length === 0
                ? "No leads yet"
                : hasStageFilter && !hasSearch
                  ? "No leads match this stage."
                  : "No leads match your search"}
            </h3>

            <p>
              {leads.length === 0
                ? "Start building your sales pipeline by adding your first lead."
                : hasStageFilter && !hasSearch
                  ? "Try selecting a different stage."
                  : "Try a different name, email, or phone number."}
            </p>
            {leads.length === 0 && (
              <button type="button" className="primary-button" onClick={openCreateModal}>
                <Plus size={17} />
                Add Lead
              </button>
            )}

          </div>

        ) : (

          <div className="table-wrapper">
            <p className="leads-result-count">
              {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
            </p>

            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Assigned To</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredLeads.map(
                  (lead) => (

                    <tr
                      key={lead.id}
                      className="leads-table-row"
                    >

                      <td className="leads-table-id">
                        #{lead.id}
                      </td>

                      <td>
                        <strong>
                          {lead.name}
                        </strong>
                      </td>

                      <td>
                        <div className="lead-contact">
                          <span>{lead.phone || "No phone"}</span>
                          <small>{lead.email || "No email"}</small>
                        </div>
                      </td>

                      <td>

                        <span
                          className={`lead-stage stage--${(
                            lead.stage ||
                            "new"
                          ).toLowerCase()}`}
                        >
                          {formatStage(
                            lead.stage
                          )}
                        </span>

                      </td>

                      <td>
                        {lead.assignedTo
                          ?.name ||
                          "Unassigned"}
                      </td>

                      <td>
                        {(() => {
                          const followUp = getFollowUpStatus(lead.followUpDate);
                          return followUp ? (
                            <div className={`lead-follow-up lead-follow-up--${followUp.tone}`}>
                              <span className="lead-follow-up-date">{followUp.date}</span>
                              <span className="lead-follow-up-status">
                                {followUp.status !== "Upcoming" && (
                                  <span className="lead-follow-up-dot" aria-hidden="true" />
                                )}
                                {followUp.status}
                              </span>
                            </div>
                          ) : "-";
                        })()}
                      </td>

                      <td>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                          }}
                        >

                          {/* VIEW */}

                          <button
                            type="button"
                            className="view-button"
                            title="View lead"
                            aria-label={`View ${lead.name}`}
                            onClick={() =>
                              openViewModal(
                                lead
                              )
                            }
                          >
                            <Eye
                              size={17}
                            />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              className="view-button danger"
                              title="Delete Lead"
                              aria-label={`Delete ${lead.name}`}
                              onClick={() => setConfirmationLead(lead)}
                            >
                              <Trash2 size={17} />
                            </button>
                          )}

                          {/* EDIT */}

                          <button
                            type="button"
                            className="view-button"
                            title="Edit lead"
                            aria-label={`Edit ${lead.name}`}
                            onClick={() =>
                              openEditModal(
                                lead
                              )
                            }
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          VIEW / EDIT / CREATE MODAL
      ================================================= */}

      {showModal && (

        <div className="modal-overlay">

          <div className="modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {modalMode ===
                    "create" &&
                    "Add New Lead"}

                  {modalMode ===
                    "view" &&
                    "Lead Details"}

                  {modalMode ===
                    "edit" &&
                    "Edit Lead"}
                </h2>

                <p>
                  {modalMode ===
                    "create" &&
                    "Enter lead information"}

                  {modalMode ===
                    "view" &&
                    "View lead information"}

                  {modalMode ===
                    "edit" &&
                    "Update lead information"}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            {/* =================================================
                VIEW MODE
            ================================================= */}

            {modalMode ===
              "view" &&
              selectedLead && (

                <div
                  className="lead-details"
                  style={{
                    display:
                      "grid",
                    gap:
                      "14px",
                    padding:
                      "20px 0",
                  }}
                >

                  <div
                    className="detail-item"
                  >
                    <span>
                      Name
                    </span>

                    <strong>
                      {selectedLead.name ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedLead.email ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedLead.phone ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Stage
                    </span>

                    <strong>
                      <span
                        className={`lead-stage stage--${(
                          selectedLead.stage ||
                          "new"
                        ).toLowerCase()}`}
                      >
                        {formatStage(selectedLead.stage)}
                      </span>
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Assigned To
                    </span>

                    <strong>
                      {selectedLead
                        .assignedTo
                        ?.name ||
                        "Unassigned"}
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Follow-up
                    </span>

                    <strong>
                      {formatDate(
                        selectedLead.followUpDate
                      )}
                    </strong>
                  </div>

                  <div
                    className="detail-item"
                  >
                    <span>
                      Notes
                    </span>

                    <strong>
                      {selectedLead.notes ||
                        "No notes added"}
                    </strong>
                  </div>

                  <div
                    className="modal-actions"
                  >

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() =>
                        openEditModal(
                          selectedLead
                        )
                      }
                    >
                      <Pencil
                        size={16}
                      />
                      Edit Lead
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        closeModal
                      }
                    >
                      Close
                    </button>

                  </div>

                </div>
              )}

            {/* =================================================
                CREATE / EDIT FORM
            ================================================= */}

            {(modalMode ===
              "create" ||
              modalMode ===
                "edit") && (

              <form
              className="lead-form lead-form-shell"
                onSubmit={
                  handleSubmit
                }
              >

              <div className="lead-form-body">
              {error && (
                <div className="modal-error error-message" role="alert">
                  {error}
                </div>
              )}
              {/* NAME */}

                <div
                  className="form-group"
                >

                  <label htmlFor="lead-name">
                    Name *
                  </label>

                  <input
                    id="lead-name"
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter lead name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
                  />
                  {fieldErrors.name && <span id="lead-name-error" className="field-error" role="alert">{fieldErrors.name}</span>}

                </div>

                {/* EMAIL + PHONE */}

                <div
                  className="form-row"
                >

                  <div
                    className="form-group"
                  >

                    <label htmlFor="lead-email">
                      Email
                    </label>

                    <input
                      id="lead-email"
                      type="email"
                      name="email"
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="customer@example.com"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? "lead-email-error" : undefined}
                    />
                    {fieldErrors.email && <span id="lead-email-error" className="field-error" role="alert">{fieldErrors.email}</span>}

                  </div>

                  <div
                    className="form-group"
                  >

                    <label htmlFor="lead-phone">
                      Phone
                    </label>

                    <input
                      id="lead-phone"
                      type="tel"
                      name="phone"
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="9876543210"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "lead-phone-error" : undefined}
                    />
                    {fieldErrors.phone && <span id="lead-phone-error" className="field-error" role="alert">{fieldErrors.phone}</span>}

                  </div>

                </div>

                {/* STAGE */}

                <div
                  className="form-group"
                >

                  <label htmlFor="lead-stage">
                    Stage
                  </label>

                  <select
                    id="lead-stage"
                    name="stage"
                    value={
                      form.stage
                    }
                    onChange={
                      handleChange
                    }
                  >

                    {stages.map(
                      (stage) => (

                        <option
                          key={stage}
                          value={stage}
                        >
                          {formatStage(
                            stage
                          )}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {isAdmin && (
                  <div className="form-group">
                    <label htmlFor="lead-assignee">
                      Assigned Employee
                    </label>

                    <select
                      id="lead-assignee"
                      name="assignedToId"
                      value={form.assignedToId}
                      onChange={handleChange}
                    >
                      {employees.length === 0 ? (
                        <option value="" disabled>No employees available</option>
                      ) : (
                        <>
                          <option value="">Unassigned</option>
                          {employees.map((employee) => (
                            <option
                              key={employee.id}
                              value={employee.id}
                            >
                              {employee.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* FOLLOW-UP */}

                <div
                  className="form-group"
                >

                  <label htmlFor="lead-follow-up">
                    Follow-up Date
                  </label>

                  <input
                    id="lead-follow-up"
                    type="datetime-local"
                    name="followUpDate"
                    value={
                      form.followUpDate
                    }
                    onChange={
                      handleChange
                    }
                    min={modalMode === "create"
                      ? new Date().toISOString().slice(0, 16)
                      : undefined}
                    aria-invalid={Boolean(fieldErrors.followUpDate)}
                    aria-describedby={fieldErrors.followUpDate ? "lead-follow-up-error" : undefined}
                  />
                  {fieldErrors.followUpDate && <span id="lead-follow-up-error" className="field-error" role="alert">{fieldErrors.followUpDate}</span>}

                </div>

                {/* NOTES */}

                <div
                  className="form-group"
                >

                  <label htmlFor="lead-notes">
                    Notes
                  </label>

                  <textarea
                    id="lead-notes"
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Add notes..."
                    rows="4"
                    maxLength={2000}
                  />

                </div>

                </div>
                {/* ACTIONS */}

                <div
                  className="modal-actions lead-form-footer"
                >

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? modalMode === "create" ? "Creating lead..." : "Saving..."
                      : modalMode ===
                        "edit"
                      ? "Save Changes"
                      : "Create Lead"}
                  </button>

                </div>

              </form>
            )}

          </div>

        </div>
      )}

      <ConfirmDialog
        isOpen={confirmationLead !== null}
        title="Delete this lead?"
        message="This action cannot be undone."
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        isDestructive
        isPending={deletingLead}
        onCancel={() => {
          if (!deletingLead) setConfirmationLead(null);
        }}
        onConfirm={() => handleDelete(confirmationLead)}
      />

    </div>
  );
}