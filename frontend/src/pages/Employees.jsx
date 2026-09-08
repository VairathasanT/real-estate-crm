import { useEffect, useState } from "react";
import {
  RefreshCw,
  Users,
  ShieldCheck,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/employees");

      const data = response.data;

      setEmployees(
        Array.isArray(data)
          ? data
          : data?.employees || []
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load employees."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
    if (role === "ADMIN") return "Administrator";

    if (role === "SALES") return "Sales Employee";

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

  return (
    <div className="page-container">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <h1>Employees</h1>

          <p>
            View sales team members and performance
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadEmployees}
          disabled={loading}
        >
          <RefreshCw size={17} />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-message">
          {error}
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

            <strong>
              {employees.length}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>Administrators</span>

            <strong>
              {adminCount}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <UserRound size={22} />
          </div>

          <div>
            <span>Sales Employees</span>

            <strong>
              {salesCount}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <span>Assigned Leads</span>

            <strong>
              {totalLeads}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          EMPLOYEES
      ====================================================== */}

      <div className="section-header">

        <div>
          <h2>Team Members</h2>

          <p>
            Employees with access to the CRM
          </p>
        </div>

      </div>

      {loading ? (

        <div className="dashboard-card empty-state">

          <RefreshCw size={36} />

          <h3>
            Loading employees...
          </h3>

          <p>
            Please wait while we load the team.
          </p>

        </div>

      ) : employees.length === 0 ? (

        <div className="dashboard-card empty-state">

          <Users size={36} />

          <h3>
            No employees found
          </h3>

          <p>
            There are currently no employees
            registered in the CRM.
          </p>

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
                </tr>

              </thead>

              <tbody>

                {employees.map(
                  (employee) => (
                    <tr
                      key={employee.id}
                    >

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
                              Employee #
                              {employee.id}
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

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* =====================================================
          PERFORMANCE SUMMARY
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
                        <span>
                          Leads
                        </span>

                        <strong>
                          {employee._count
                            ?.assignedLeads ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Bookings
                        </span>

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

    </div>
  );
}