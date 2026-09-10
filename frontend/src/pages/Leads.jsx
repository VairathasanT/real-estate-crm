import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
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
  const [searchParams] = useSearchParams();

  // =========================================================
  // ROLE
  // =========================================================

  const role = String(
    user?.role || user?.user?.role || ""
  ).toUpperCase();

  const isAdmin = role === "ADMIN";

  // =========================================================
  // STATE
  // =========================================================

  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(
    () => searchParams.get("stage") || ""
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const [selectedLead, setSelectedLead] = useState(null);
  const [confirmationLead, setConfirmationLead] = useState(null);

  const [form, setForm] = useState({
    ...initialForm,
  });

  // =========================================================
  // API RESPONSE HELPERS
  // =========================================================

  const extractLead = (data) => {
    if (!data) return null;

    if (data.lead && typeof data.lead === "object") {
      return data.lead;
    }

    return data;
  };

  const extractLeadList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.leads)) {
      return data.leads;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  const extractEmployeeList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.employees)) {
      return data.employees;
    }

    if (Array.isArray(data?.users)) {
      return data.users;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  // =========================================================
  // LOAD LEADS
  // =========================================================

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/leads");

      const list = extractLeadList(response.data);

      setLeads(list);
    } catch (err) {
      console.error("GET LEADS ERROR:", err);

      setLeads([]);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load leads. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // LOAD SALES EMPLOYEES
  // =========================================================
  //
  // IMPORTANT:
  // Admin needs employees for lead assignment.
  // Sales does NOT need this endpoint because the backend
  // automatically assigns Sales-created leads to themselves.
  //
  // =========================================================

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) {
      setEmployees([]);
      return;
    }

    try {
      const response = await api.get("/auth/employees");

      const list = extractEmployeeList(response.data);

      const salesEmployees = list.filter(
        (employee) =>
          String(employee?.role || "").toUpperCase() ===
          "SALES"
      );

      setEmployees(salesEmployees);
    } catch (err) {
      console.error("GET SALES EMPLOYEES ERROR:", err);

      setEmployees([]);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load sales employees."
        )
      );
    }
  }, [isAdmin]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (isAdmin) {
      loadEmployees();
    } else {
      setEmployees([]);
    }
  }, [isAdmin, loadEmployees]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => {
      if (!previous[name]) {
        return previous;
      }

      const next = {
        ...previous,
      };

      delete next[name];

      return next;
    });

    setError("");
  };

  // =========================================================
  // DATE-ONLY HELPERS
  // =========================================================
  //
  // Follow-up dates are entered as dates only. The database can
  // continue storing DateTime values. These helpers preserve the
  // selected calendar date across browser timezone conversions.
  // =========================================================

  const formatDateInputValue = (date) => {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const parseDateInputValue = (dateString) => {
    if (!dateString) {
      return null;
    }

    const [year, month, day] = dateString.split("-").map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      return null;
    }

    const value = new Date(year, month - 1, day);

    if (
      value.getFullYear() !== year ||
      value.getMonth() !== month - 1 ||
      value.getDate() !== day
    ) {
      return null;
    }

    return value;
  };

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedLead(null);

    setForm({
      ...initialForm,
    });

    setError("");
    setSuccess("");
    setFieldErrors({});

    setShowModal(true);
  };

  // =========================================================
  // OPEN VIEW MODAL
  // =========================================================

  const openViewModal = async (lead) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(
        `/leads/${lead.id}`
      );

      const data = extractLead(response.data);

      if (!data) {
        throw new Error("Lead details were not returned.");
      }

      setSelectedLead(data);
      setModalMode("view");
      setShowModal(true);
    } catch (err) {
      console.error("GET LEAD ERROR:", err);

      setError(
        getApiErrorMessage(
          err,
          "Unable to load lead details."
        )
      );
    }
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = async (lead) => {
    try {
      setError("");
      setSuccess("");
      setFieldErrors({});

      const response = await api.get(
        `/leads/${lead.id}`
      );

      const data = extractLead(response.data);

      if (!data) {
        throw new Error("Lead details were not returned.");
      }

      setSelectedLead(data);

      setForm({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        stage: data.stage || "NEW",
        notes: data.notes || "",
        followUpDate: formatDateInputValue(
          data.followUpDate
        ),
        assignedToId:
          data.assignedToId !== null &&
          data.assignedToId !== undefined
            ? String(data.assignedToId)
            : data.assignedTo?.id
              ? String(data.assignedTo.id)
              : "",
      });

      setModalMode("edit");
      setShowModal(true);
    } catch (err) {
      console.error(
        "GET LEAD FOR EDIT ERROR:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to load lead for editing."
        )
      );
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = useCallback(() => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setSelectedLead(null);
    setModalMode("create");

    setForm({
      ...initialForm,
    });

    setFieldErrors({});
    setError("");
  }, [saving]);

  // =========================================================
  // ESCAPE KEY
  // =========================================================

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        closeModal();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    showModal,
    saving,
    closeModal,
  ]);

  // =========================================================
  // VALIDATE FORM
  // =========================================================

  const validateForm = () => {
    const nextErrors = {};

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    const followUpDate = form.followUpDate
      ? parseDateInputValue(form.followUpDate)
      : null;

    // -----------------------------
    // NAME
    // -----------------------------

    if (!name) {
      nextErrors.name = "Name is required.";
    } else if (name.length < 2) {
      nextErrors.name =
        "Name must contain at least 2 characters.";
    } else if (name.length > 100) {
      nextErrors.name =
        "Name must not exceed 100 characters.";
    }

    // -----------------------------
    // EMAIL
    // -----------------------------

    if (email) {
      if (email.length > 150) {
        nextErrors.email =
          "Email must not exceed 150 characters.";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        nextErrors.email =
          "Enter a valid email address.";
      }
    }

    // -----------------------------
    // PHONE
    // -----------------------------

    if (phone) {
      const digits = phone.replace(/\D/g, "");

      if (
        !/^[+\d\s().-]+$/.test(phone) ||
        digits.length < 7 ||
        digits.length > 15
      ) {
        nextErrors.phone =
          "Enter a valid phone number.";
      }
    }

    // -----------------------------
    // FOLLOW-UP
    // -----------------------------

    if (followUpDate) {
      if (
        Number.isNaN(
          followUpDate.getTime()
        )
      ) {
        nextErrors.followUpDate =
          "Enter a valid follow-up date.";
      } else if (
        modalMode === "create" &&
        followUpDate.getTime() < Date.now()
      ) {
        nextErrors.followUpDate =
          "Follow-up date cannot be in the past.";
      }
    }

    // -----------------------------
    // NOTES
    // -----------------------------

    if (form.notes.trim().length > 2000) {
      nextErrors.notes =
        "Notes must not exceed 2000 characters.";
    }

    // -----------------------------
    // ADMIN ASSIGNMENT
    // -----------------------------

    if (
      isAdmin &&
      form.assignedToId
    ) {
      const assignedEmployee = employees.find(
        (employee) =>
          String(employee.id) ===
          String(form.assignedToId)
      );

      if (!assignedEmployee) {
        nextErrors.assignedToId =
          "Please select a valid Sales employee.";
      }
    }

    return nextErrors;
  };

  // =========================================================
  // CREATE / UPDATE LEAD
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();

    if (
      Object.keys(nextErrors).length > 0
    ) {
      setFieldErrors(nextErrors);
      setError("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setFieldErrors({});

      // =====================================================
      // PAYLOAD
      // =====================================================

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
            ? parseDateInputValue(
                form.followUpDate
              )?.toISOString() || null
            : null,

        // Only Admin can send assignedToId.
        // Sales leads are automatically assigned
        // by the backend to the logged-in Sales employee.
        ...(isAdmin
          ? {
              assignedToId:
                form.assignedToId
                  ? Number(
                      form.assignedToId
                    )
                  : null,
            }
          : {}),
      };

      // =====================================================
      // CREATE
      // =====================================================

      if (modalMode === "create") {
        await api.post(
          "/leads",
          payload
        );
      }

      // =====================================================
      // UPDATE
      // =====================================================

      if (
        modalMode === "edit" &&
        selectedLead
      ) {
        await api.put(
          `/leads/${selectedLead.id}`,
          payload
        );
      }

      // =====================================================
      // CLOSE
      // =====================================================

      const successMessage =
        modalMode === "create"
          ? "Lead created successfully."
          : "Lead updated successfully.";

      setShowModal(false);
      setSelectedLead(null);
      setModalMode("create");

      setForm({
        ...initialForm,
      });

      setFieldErrors({});

      // =====================================================
      // REFRESH
      // =====================================================

      await loadLeads();

      // Reload employee list for Admin
      // in case employee assignment changed.
      if (isAdmin) {
        await loadEmployees();
      }

      setSuccess(successMessage);

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(
        "SAVE LEAD ERROR:",
        err?.response?.data || err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to save lead."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE LEAD
  // =========================================================

  const handleDelete = async (lead) => {
    if (!lead?.id) {
      return;
    }

    try {
      setDeletingLead(true);
      setError("");
      setSuccess("");

      await api.delete(
        `/leads/${lead.id}`
      );

      await loadLeads();

      setSuccess(
        "Lead deleted successfully."
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error(
        "DELETE LEAD ERROR:",
        err?.response?.data || err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete lead."
        )
      );
    } finally {
      setDeletingLead(false);
      setConfirmationLead(null);
    }
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredLeads = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return leads.filter((lead) => {
      const searchableText = [
        lead?.name,
        lead?.email,
        lead?.phone,
        lead?.stage,
        lead?.assignedTo?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(
          searchValue
        );

      const matchesStage =
        !stageFilter ||
        lead?.stage === stageFilter;

      return (
        matchesSearch &&
        matchesStage
      );
    });
  }, [
    leads,
    search,
    stageFilter,
  ]);

  const hasSearch =
    search.trim().length > 0;

  const hasStageFilter =
    Boolean(stageFilter);

  // =========================================================
  // FORMAT STAGE
  // =========================================================

  const formatStage = (stage) => {
    if (!stage) {
      return "-";
    }

    return String(stage)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

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

  // =========================================================
  // FOLLOW-UP STATUS
  // =========================================================

  const getFollowUpStatus = (date) => {
    if (!date) {
      return null;
    }

    const value = new Date(date);

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfDate = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

    const dayDifference = Math.round(
      (startOfDate.getTime() -
        startOfToday.getTime()) /
        86400000
    );

    const formattedDate =
      formatDate(date);

    if (dayDifference < 0) {
      return {
        date: formattedDate,
        status: "Overdue",
        tone: "overdue",
      };
    }

    if (dayDifference === 0) {
      return {
        date: formattedDate,
        status: "Today",
        tone: "today",
      };
    }

    if (dayDifference === 1) {
      return {
        date: formattedDate,
        status: "Tomorrow",
        tone: "tomorrow",
      };
    }

    return {
      date: formattedDate,
      status: "Upcoming",
      tone: "upcoming",
    };
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="page-container">
      {/* ===================================================
          HEADER
      =================================================== */}

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

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <div className="leads-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search leads..."
            aria-label="Search leads by name, email, phone, stage or employee"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <select
          className="leads-stage-filter"
          value={stageFilter}
          onChange={(event) =>
            setStageFilter(
              event.target.value
            )
          }
          aria-label="Filter leads by stage"
        >
          <option value="">
            All stages
          </option>

          {stages.map((stage) => (
            <option
              key={stage}
              value={stage}
            >
              {formatStage(stage)}
            </option>
          ))}
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

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (
        <div
          className="success-message"
          role="status"
        >
          {success}
        </div>
      )}

      {/* ===================================================
          TABLE CARD
      =================================================== */}

      <div className="dashboard-card leads-card">
        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div
            className="leads-loading"
            aria-label="Loading leads"
          >
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
            <div className="skeleton skeleton-row" />
          </div>
        ) : filteredLeads.length === 0 ? (
          /* ===============================================
             EMPTY STATE
          =============================================== */

          <div className="empty-state">
            <h3>
              {leads.length === 0
                ? "No leads yet"
                : hasStageFilter &&
                    !hasSearch
                  ? "No leads match this stage."
                  : "No leads match your search"}
            </h3>

            <p>
              {leads.length === 0
                ? "Start building your sales pipeline by adding your first lead."
                : hasStageFilter &&
                    !hasSearch
                  ? "Try selecting a different stage."
                  : "Try a different name, email, phone, stage, or employee."}
            </p>

            {leads.length === 0 && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  openCreateModal
                }
              >
                <Plus size={17} />
                Add Lead
              </button>
            )}
          </div>
        ) : (
          /* ===============================================
             TABLE
          =============================================== */

          <div className="table-wrapper">
            <p className="leads-result-count">
              {filteredLeads.length}{" "}
              {filteredLeads.length === 1
                ? "lead"
                : "leads"}
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
                      {/* ID */}

                      <td className="leads-table-id">
                        #{lead.id}
                      </td>

                      {/* LEAD */}

                      <td>
                        <strong>
                          {lead.name ||
                            "Unnamed Lead"}
                        </strong>
                      </td>

                      {/* CONTACT */}

                      <td>
                        <div className="lead-contact">
                          <span>
                            {lead.phone ||
                              "No phone"}
                          </span>

                          <small>
                            {lead.email ||
                              "No email"}
                          </small>
                        </div>
                      </td>

                      {/* STAGE */}

                      <td>
                        <span
                          className={`lead-stage stage--${String(
                            lead.stage ||
                              "new"
                          ).toLowerCase()}`}
                        >
                          {formatStage(
                            lead.stage
                          )}
                        </span>
                      </td>

                      {/* ASSIGNED EMPLOYEE */}

                      <td>
                        {lead.assignedTo
                          ?.name ||
                          "Unassigned"}
                      </td>

                      {/* FOLLOW-UP */}

                      <td>
                        {(() => {
                          const followUp =
                            getFollowUpStatus(
                              lead.followUpDate
                            );

                          if (!followUp) {
                            return "-";
                          }

                          return (
                            <div
                              className={`lead-follow-up lead-follow-up--${followUp.tone}`}
                            >
                              <span className="lead-follow-up-date">
                                {
                                  followUp.date
                                }
                              </span>

                              <span className="lead-follow-up-status">
                                {followUp.status !==
                                  "Upcoming" && (
                                  <span
                                    className="lead-follow-up-dot"
                                    aria-hidden="true"
                                  />
                                )}

                                {
                                  followUp.status
                                }
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          {/* VIEW */}

                          <button
                            type="button"
                            className="view-button"
                            title="View lead"
                            aria-label={`View ${
                              lead.name ||
                              "lead"
                            }`}
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

                          {/* EDIT */}

                          <button
                            type="button"
                            className="view-button"
                            title="Edit lead"
                            aria-label={`Edit ${
                              lead.name ||
                              "lead"
                            }`}
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

                          {/* DELETE - ADMIN ONLY */}

                          {isAdmin && (
                            <button
                              type="button"
                              className="view-button danger"
                              title="Delete lead"
                              aria-label={`Delete ${
                                lead.name ||
                                "lead"
                              }`}
                              onClick={() =>
                                setConfirmationLead(
                                  lead
                                )
                              }
                              disabled={
                                deletingLead
                              }
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          )}
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

      {/* ===================================================
          CREATE / EDIT / VIEW MODAL
      =================================================== */}

      {showModal && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
          >
            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div className="modal-header">
              <div>
                <h2 id="lead-modal-title">
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
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* =============================================
                VIEW MODE
            ============================================= */}

            {modalMode === "view" &&
              selectedLead && (
                <div
                  className="lead-details"
                  style={{
                    display: "grid",
                    gap: "14px",
                    padding: "20px 0",
                  }}
                >
                  {/* NAME */}

                  <div className="detail-item">
                    <span>
                      Name
                    </span>

                    <strong>
                      {selectedLead.name ||
                        "-"}
                    </strong>
                  </div>

                  {/* EMAIL */}

                  <div className="detail-item">
                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedLead.email ||
                        "-"}
                    </strong>
                  </div>

                  {/* PHONE */}

                  <div className="detail-item">
                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedLead.phone ||
                        "-"}
                    </strong>
                  </div>

                  {/* STAGE */}

                  <div className="detail-item">
                    <span>
                      Stage
                    </span>

                    <strong>
                      <span
                        className={`lead-stage stage--${String(
                          selectedLead.stage ||
                            "new"
                        ).toLowerCase()}`}
                      >
                        {formatStage(
                          selectedLead.stage
                        )}
                      </span>
                    </strong>
                  </div>

                  {/* ASSIGNED */}

                  <div className="detail-item">
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

                  {/* FOLLOW-UP */}

                  <div className="detail-item">
                    <span>
                      Follow-up
                    </span>

                    <strong>
                      {formatDate(
                        selectedLead.followUpDate
                      )}
                    </strong>
                  </div>

                  {/* CREATED */}

                  {selectedLead.createdAt && (
                    <div className="detail-item">
                      <span>
                        Created
                      </span>

                      <strong>
                        {formatDate(
                          selectedLead.createdAt
                        )}
                      </strong>
                    </div>
                  )}

                  {/* UPDATED */}

                  {selectedLead.updatedAt && (
                    <div className="detail-item">
                      <span>
                        Last Updated
                      </span>

                      <strong>
                        {formatDate(
                          selectedLead.updatedAt
                        )}
                      </strong>
                    </div>
                  )}

                  {/* NOTES */}

                  <div className="detail-item">
                    <span>
                      Notes
                    </span>

                    <strong>
                      {selectedLead.notes ||
                        "No notes added"}
                    </strong>
                  </div>

                  {/* ACTIONS */}

                  <div className="modal-actions">
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

            {/* =============================================
                CREATE / EDIT FORM
            ============================================= */}

            {(modalMode === "create" ||
              modalMode === "edit") && (
              <form
                className="lead-form lead-form-shell"
                onSubmit={
                  handleSubmit
                }
              >
                <div className="lead-form-body">
                  {/* =======================================
                      MODAL ERROR
                  ======================================= */}

                  {error && (
                    <div
                      className="modal-error error-message"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  {/* =======================================
                      NAME
                  ======================================= */}

                  <div className="form-group">
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
                      maxLength={100}
                      required
                      autoFocus
                      aria-invalid={Boolean(
                        fieldErrors.name
                      )}
                      aria-describedby={
                        fieldErrors.name
                          ? "lead-name-error"
                          : undefined
                      }
                    />

                    {fieldErrors.name && (
                      <span
                        id="lead-name-error"
                        className="field-error"
                        role="alert"
                      >
                        {
                          fieldErrors.name
                        }
                      </span>
                    )}
                  </div>

                  {/* =======================================
                      EMAIL + PHONE
                  ======================================= */}

                  <div className="form-row">
                    {/* EMAIL */}

                    <div className="form-group">
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
                        maxLength={150}
                        aria-invalid={Boolean(
                          fieldErrors.email
                        )}
                        aria-describedby={
                          fieldErrors.email
                            ? "lead-email-error"
                            : undefined
                        }
                      />

                      {fieldErrors.email && (
                        <span
                          id="lead-email-error"
                          className="field-error"
                          role="alert"
                        >
                          {
                            fieldErrors.email
                          }
                        </span>
                      )}
                    </div>

                    {/* PHONE */}

                    <div className="form-group">
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
                        maxLength={20}
                        aria-invalid={Boolean(
                          fieldErrors.phone
                        )}
                        aria-describedby={
                          fieldErrors.phone
                            ? "lead-phone-error"
                            : undefined
                        }
                      />

                      {fieldErrors.phone && (
                        <span
                          id="lead-phone-error"
                          className="field-error"
                          role="alert"
                        >
                          {
                            fieldErrors.phone
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* =======================================
                      STAGE
                  ======================================= */}

                  <div className="form-group">
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

                  {/* =======================================
                      ASSIGNED EMPLOYEE
                      ADMIN ONLY
                  ======================================= */}

                  {isAdmin && (
                    <div className="form-group">
                      <label htmlFor="lead-assignee">
                        Assigned Employee
                      </label>

                      <select
                        id="lead-assignee"
                        name="assignedToId"
                        value={
                          form.assignedToId
                        }
                        onChange={
                          handleChange
                        }
                        aria-invalid={Boolean(
                          fieldErrors.assignedToId
                        )}
                        aria-describedby={
                          fieldErrors.assignedToId
                            ? "lead-assignee-error"
                            : undefined
                        }
                      >
                        {employees.length ===
                        0 ? (
                          <option
                            value=""
                            disabled
                          >
                            No Sales employees available
                          </option>
                        ) : (
                          <>
                            <option value="">
                              Unassigned
                            </option>

                            {employees.map(
                              (
                                employee
                              ) => (
                                <option
                                  key={
                                    employee.id
                                  }
                                  value={
                                    employee.id
                                  }
                                >
                                  {
                                    employee.name
                                  }
                                </option>
                              )
                            )}
                          </>
                        )}
                      </select>

                      {fieldErrors.assignedToId && (
                        <span
                          id="lead-assignee-error"
                          className="field-error"
                          role="alert"
                        >
                          {
                            fieldErrors.assignedToId
                          }
                        </span>
                      )}
                    </div>
                  )}

                  {/* =======================================
                      FOLLOW-UP DATE
                  ======================================= */}

                  <div className="form-group">
                    <label htmlFor="lead-follow-up">
                      Follow-up Date
                    </label>

                    <input
                      id="lead-follow-up"
                      type="date"
                      name="followUpDate"
                      value={
                        form.followUpDate
                      }
                      onChange={
                        handleChange
                      }
                      min={
                        modalMode ===
                        "create"
                          ? new Date()
                              .toISOString()
                              .slice(
                                0,
                                10
                              )
                          : undefined
                      }
                      aria-invalid={Boolean(
                        fieldErrors.followUpDate
                      )}
                      aria-describedby={
                        fieldErrors.followUpDate
                          ? "lead-follow-up-error"
                          : undefined
                      }
                    />

                    {fieldErrors.followUpDate && (
                      <span
                        id="lead-follow-up-error"
                        className="field-error"
                        role="alert"
                      >
                        {
                          fieldErrors.followUpDate
                        }
                      </span>
                    )}
                  </div>

                  {/* =======================================
                      NOTES
                  ======================================= */}

                  <div className="form-group">
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
                      rows={4}
                      maxLength={2000}
                      aria-invalid={Boolean(
                        fieldErrors.notes
                      )}
                      aria-describedby={
                        fieldErrors.notes
                          ? "lead-notes-error"
                          : undefined
                      }
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        fontSize:
                          "12px",
                        opacity: 0.65,
                        marginTop:
                          "4px",
                      }}
                    >
                      {
                        form.notes
                          .length
                      }
                      /2000
                    </div>

                    {fieldErrors.notes && (
                      <span
                        id="lead-notes-error"
                        className="field-error"
                        role="alert"
                      >
                        {
                          fieldErrors.notes
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* =========================================
                    FORM ACTIONS
                ========================================= */}

                <div className="modal-actions lead-form-footer">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? modalMode ===
                        "create"
                        ? "Creating lead..."
                        : "Saving..."
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

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}

      <ConfirmDialog
        isOpen={
          confirmationLead !== null
        }
        title="Delete this lead?"
        message={
          confirmationLead
            ? `Are you sure you want to delete "${confirmationLead.name}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        isDestructive
        isPending={
          deletingLead
        }
        onCancel={() => {
          if (!deletingLead) {
            setConfirmationLead(
              null
            );
          }
        }}
        onConfirm={() =>
          handleDelete(
            confirmationLead
          )
        }
      />
    </div>
  );
}