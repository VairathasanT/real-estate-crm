import{ useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  RefreshCw,
  Users,
  ShieldCheck,
  UserRound,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "SALES",
};

export default function Employees() {
  const { user } = useAuth();

  const role = String(
    user?.role || user?.user?.role || ""
  ).toUpperCase();

  const isAdmin = role === "ADMIN";
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);

  const [deleteEmployeeId, setDeleteEmployeeId] =
    useState(null);

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/auth/employees");

      const data = response.data;

      setEmployees(
        Array.isArray(data)
          ? data
          : data?.employees || []
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load employees."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      setError("Access denied");
      return;
    }

    loadEmployees();
  }, [user, isAdmin]);

  // =========================================================
  // COUNTS
  // =========================================================

  const adminCount = employees.filter(
    (employee) => employee.role === "ADMIN"
  ).length;

  const salesCount = employees.filter(
    (employee) => employee.role === "SALES"
  ).length;

  const totalLeads = employees.reduce(
    (total, employee) =>
      total +
      (employee._count?.assignedLeads || 0),
    0
  );

  const totalBookings = employees.reduce(
    (total, employee) =>
      total +
      (employee._count?.bookings || 0),
    0
  );

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================================
  // OPEN CREATE
  // =========================================================

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm({
      ...initialForm,
    });
    setShowPassword(false);

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEditModal = (employee) => {
    setEditingEmployee(employee);

    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "SALES",
    });
    setShowPassword(false);

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
    setEditingEmployee(null);
    setForm({
      ...initialForm,
    });
    setShowPassword(false);

    setError("");
  };

  // =========================================================
  // SAVE EMPLOYEE
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Employee email is required.");
      return;
    }

    if (
      !editingEmployee &&
      !form.password
    ) {
      setError("Password is required.");
      return;
    }

    if (
      form.password &&
      form.password.length < 8
    ) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      // Only send password when creating or
      // when an admin intentionally changes it.
      if (form.password) {
        payload.password = form.password;
      }

      if (editingEmployee) {
        await api.put(
          `/auth/employees/${editingEmployee.id}`,
          payload
        );

        setSuccess(
          "Employee updated successfully."
        );
      } else {
        await api.post(
          "/auth/employees",
          payload
        );

        setSuccess(
          "Employee created successfully."
        );
      }

      setShowModal(false);
      setEditingEmployee(null);
      setForm({
        ...initialForm,
      });
      setShowPassword(false);

      await loadEmployees();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          editingEmployee
            ? "Unable to update employee."
            : "Unable to create employee."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async () => {
    if (!deleteEmployeeId) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.delete(
        `/auth/employees/${deleteEmployeeId}`
      );

      setSuccess(
        "Employee deleted successfully."
      );

      setDeleteEmployeeId(null);

      await loadEmployees();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to delete employee."
        )
      );
    } finally {
      setSaving(false);
    }
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
  // ROLE LABEL
  // =========================================================

  const roleLabel = (role) => {
    if (role === "ADMIN") {
      return "Administrator";
    }

    if (role === "SALES") {
      return "Sales Employee";
    }

    return role || "-";
  };

  // =========================================================
  // ROLE CLASS
  // =========================================================

  const roleClass = (role) => {
    return `employee-role role-${(
      role || ""
    ).toLowerCase()}`;
  };

  // =========================================================
  // PAGE
  // =========================================================

  if (user && !isAdmin) {
    return (
      <div className="page-container">
        <div className="error-message">
          Access denied
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h1>Employees</h1>

          <p>
            Manage CRM users, roles and sales team
            activity
          </p>
        </div>

        <div className="page-header-actions">

          <button
            type="button"
            className="refresh-button"
            onClick={loadEmployees}
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
            onClick={openCreateModal}
            disabled={saving}
          >
            <Plus size={17} />
            Add Employee
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
            <Users size={22} />
          </div>

          <div>
            <span>Total Employees</span>
            <strong>{employees.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>Administrators</span>
            <strong>{adminCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UserRound size={22} />
          </div>

          <div>
            <span>Sales Employees</span>
            <strong>{salesCount}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <span>Assigned Leads</span>
            <strong>{totalLeads}</strong>
          </div>
        </div>

      </div>

      {/* =====================================================
          TEAM HEADER
      ====================================================== */}

      <div className="section-header">

        <div>
          <h2>Team Members</h2>

          <p>
            Employees with access to the CRM
          </p>
        </div>

      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      {loading ? (

        <div className="dashboard-card empty-state">

          <RefreshCw size={36} />

          <h3>Loading employees...</h3>

          <p>
            Please wait while we load the team.
          </p>

        </div>

      ) : employees.length === 0 ? (

        <div className="dashboard-card empty-state">

          <Users size={36} />

          <h3>No employees found</h3>

          <p>
            There are currently no employees
            registered in the CRM.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Employee
          </button>

        </div>

      ) : (

        <div className="dashboard-card">

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Leads</th>
                  <th>Bookings</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {employees.map(
                  (employee) => (

                    <tr key={employee.id}>

                      <td>

                        <div className="employee-name">

                          <div className="employee-avatar">
                            {employee.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div className="employee-name-details">

                            <strong>
                              {employee.name}
                            </strong>

                            <small>
                              Employee #{employee.id}
                            </small>

                          </div>

                        </div>

                      </td>

                      <td>
                        {employee.email}
                      </td>

                      <td>

                        <span
                          className={roleClass(
                            employee.role
                          )}
                        >

                          {employee.role ===
                            "ADMIN" && (
                            <ShieldCheck
                              size={14}
                            />
                          )}

                          {employee.role ===
                            "SALES" && (
                            <UserRound
                              size={14}
                            />
                          )}

                          {roleLabel(
                            employee.role
                          )}

                        </span>

                      </td>

                      <td>
                        <strong>
                          {employee._count
                            ?.assignedLeads ||
                            0}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {employee._count
                            ?.bookings ||
                            0}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          employee.createdAt
                        )}
                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            className="table-action"
                            onClick={() =>
                              openEditModal(
                                employee
                              )
                            }
                            disabled={saving}
                            title="Edit employee"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="table-action danger"
                            onClick={() =>
                              setDeleteEmployeeId(
                                employee.id
                              )
                            }
                            disabled={saving}
                            title="Delete employee"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* =====================================================
          TEAM OVERVIEW
      ====================================================== */}

      {!loading &&
        employees.length > 0 && (

          <div className="employee-performance">

            <div className="section-header">

              <div>
                <h2>Team Overview</h2>

                <p>
                  Current CRM activity across
                  employees
                </p>
              </div>

            </div>

            <div className="employee-performance-grid">

              {employees
                .filter(
                  (employee) =>
                    employee.role === "SALES"
                )
                .map((employee) => (

                  <div
                    className="employee-performance-card"
                    key={employee.id}
                  >

                    <div className="employee-performance-header">

                      <div className="employee-avatar">
                        {employee.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "U"}
                      </div>

                      <div>
                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          Sales Employee
                        </span>
                      </div>

                    </div>

                    <div className="employee-performance-stats">

                      <div>
                        <span>Leads</span>

                        <strong>
                          {employee._count
                            ?.assignedLeads ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>Bookings</span>

                        <strong>
                          {employee._count
                            ?.bookings ||
                            0}
                        </strong>
                      </div>

                    </div>

                  </div>

                ))}

            </div>

            <div className="employee-total-activity">

              <div>
                <span>
                  Total team leads
                </span>

                <strong>
                  {totalLeads}
                </strong>
              </div>

              <div>
                <span>
                  Total team bookings
                </span>

                <strong>
                  {totalBookings}
                </strong>
              </div>

            </div>

          </div>

        )}

      {/* =====================================================
          EMPLOYEE MODAL
      ====================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
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

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p>
                  {editingEmployee
                    ? "Update employee details, role or password."
                    : "Create a new CRM user account."}
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

            {error && (
              <div className="error-message modal-error">
                {error}
              </div>
            )}

            <form
              className="lead-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="form-group">

                <label htmlFor="employee-name">
                  Full Name *
                </label>

                <input
                  id="employee-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter employee name"
                  autoComplete="name"
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label htmlFor="employee-email">
                  Email *
                </label>

                <input
                  id="employee-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="employee@estateflow.com"
                  autoComplete="email"
                  required
                />

              </div>

              {/* ROLE */}

              <div className="form-group">

                <label htmlFor="employee-role">
                  Role *
                </label>

                <select
                  id="employee-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="SALES">
                    Sales Employee
                  </option>

                  <option value="ADMIN">
                    Administrator
                  </option>
                </select>

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label htmlFor="employee-password">
                  Password{" "}
                  {editingEmployee
                    ? "(leave blank to keep current)"
                    : "*"}
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="employee-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingEmployee
                        ? "Enter new password only if changing it"
                        : "Minimum 8 characters"
                    }
                    autoComplete="new-password"
                    required={!editingEmployee}
                    minLength={8}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    title={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

              </div>

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
                  disabled={saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save size={17} />
                      {editingEmployee
                        ? "Save Changes"
                        : "Create Employee"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <ConfirmDialog
        isOpen={
          deleteEmployeeId !== null
        }
        title="Delete this employee?"
        message="This action cannot be undone. Employees with assigned CRM records cannot be deleted."
        confirmLabel="Delete Employee"
        cancelLabel="Keep Employee"
        isDestructive
        isPending={saving}
        onCancel={() => {
          if (!saving) {
            setDeleteEmployeeId(null);
          }
        }}
        onConfirm={handleDelete}
      />

    </div>
  );
}