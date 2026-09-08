import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  Home,
  Building2,
  LogOut,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");

      setDashboard(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load the dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <RefreshCw size={28} className="spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Unable to load dashboard</h2>

        <p>{error}</p>

        <button onClick={loadDashboard}>
          Try Again
        </button>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const pipeline = dashboard?.leadPipeline || {};
  const upcomingFollowUps = Array.isArray(dashboard?.upcomingFollowUps)
    ? dashboard.upcomingFollowUps
    : [];
  const recentBookings = Array.isArray(dashboard?.recentBookings)
    ? dashboard.recentBookings
    : [];
  const pipelineTotal = Object.values(pipeline).reduce(
    (total, value) => total + (Number(value) || 0),
    0
  );

  return (
    <div className="dashboard-page">

      {/* Header */}
      <header className="dashboard-header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Welcome back, <strong>{user?.name || "there"}</strong>
          </p>
        </div>

        <div className="header-actions">

          <span className="role-badge">
            {user?.role}
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </header>


      {/* Summary Cards */}
      <section className="stats-grid">

        <StatCard
          className="dashboard-stat-primary"
          icon={<Users size={22} />}
          title="Total Leads"
          value={summary.totalLeads}
        />

        <StatCard
          className="dashboard-stat-primary"
          icon={<CalendarCheck size={22} />}
          title="Total Bookings"
          value={summary.totalBookings}
        />

        <StatCard
          className="dashboard-stat-secondary"
          icon={<Home size={22} />}
          title="Available Units"
          value={summary.availableUnits}
        />

        <StatCard
          className="dashboard-stat-secondary"
          icon={<Building2 size={22} />}
          title="Booked Units"
          value={summary.bookedUnits}
        />

      </section>


      {/* Main Content */}
      <section className="dashboard-grid">

        {/* Lead Pipeline */}
        <div className="dashboard-card">

          <div className="card-header">
            <div>
              <h2>Lead Pipeline</h2>
              <p>Current sales pipeline</p>
            </div>
          </div>

          {pipelineTotal === 0 ? (
            <div className="empty-state">
              <Users size={28} />
              <h3>No leads in the pipeline</h3>
              <p>New leads will appear here as your sales pipeline grows.</p>
            </div>
          ) : (
            <div className="pipeline-list">
              <PipelineRow navigate={navigate} label="New" value={pipeline.new} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Contacted" value={pipeline.contacted} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Site Visit" value={pipeline.siteVisit} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Interested" value={pipeline.interested} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Negotiation" value={pipeline.negotiation} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Booked" value={pipeline.booked} total={pipelineTotal} />
              <PipelineRow navigate={navigate} label="Lost" value={pipeline.lost} total={pipelineTotal} />
            </div>
          )}

        </div>


        {/* Upcoming Follow-ups */}
        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Upcoming Follow-ups</h2>
              <p>Next scheduled activities</p>
            </div>

            <CalendarDays size={20} />

          </div>

          {upcomingFollowUps.length === 0 ? (

            <div className="empty-state">
              <CalendarDays size={28} />
              <h3>No upcoming follow-ups</h3>
              <p>Scheduled lead follow-ups will appear here.</p>
            </div>

          ) : (

            <div className="followup-list">

              {upcomingFollowUps.map(
                (                lead) => {
                  const relativeDate = getRelativeFollowUpLabel(lead?.followUpDate);

                  return (

                  <div
                    className="followup-item"
                    key={lead?.id ?? lead?.name}
                  >

                    <div className="avatar">
                      {lead.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="followup-info">

                      <strong>{lead.name}</strong>

                      <span>
                        {lead.phone || "No phone"}
                      </span>

                    </div>

                    <div className="followup-date">

                      <span className={`followup-date-badge followup-date--${relativeDate.tone}`}>
                        {relativeDate.label}
                      </span>

                    </div>

                  </div>

                  );
                }
              )}

            </div>

          )}

        </div>

      </section>


      {/* Recent Bookings */}
      <section className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>Recent Bookings</h2>
            <p>Latest confirmed bookings</p>
          </div>

          <CalendarCheck size={20} />

        </div>


        {recentBookings.length === 0 ? (

          <div className="empty-state">
            <CalendarCheck size={28} />
            <h3>No bookings found</h3>
            <p>Confirmed bookings will appear here once created.</p>
          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Lead</th>
                  <th>Unit</th>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {recentBookings.map(
                  (booking) => (

                    <tr key={booking.id}>

                      <td>
                        <strong>
                          {booking.lead?.name}
                        </strong>
                      </td>

                      <td>
                        {booking.unit?.unitNumber}
                      </td>

                      <td>
                        {
                          booking.unit?.building
                            ?.project?.name
                        }
                      </td>

                      <td>
                        {booking.unit?.type}
                      </td>

                      <td>
                        ₹
                        {Number(
                          booking.unit?.price || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        <span className="status-badge">
                          {booking.status}
                        </span>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


function StatCard({ className = "", icon, title, value }) {
  const numericValue = Number(value);

  return (
    <div className={`stat-card ${className}`}>

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>

        <h2>{Number.isFinite(numericValue) ? numericValue : 0}</h2>
      </div>

    </div>
  );
}


function PipelineRow({ navigate, label, value, total }) {
  const count = Number(value) || 0;
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <button type="button" className="pipeline-row" onClick={() => navigate(`/leads?stage=${label.toUpperCase().replaceAll(" ", "_")}`)}>
      <div className="pipeline-row-label">
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="pipeline-track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </button>
  );
}

function getRelativeFollowUpLabel(date, today = new Date()) {
  const followUp = new Date(date);
  if (Number.isNaN(followUp.getTime())) {
    return { label: "Date unavailable", tone: "default" };
  }

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfFollowUp = new Date(followUp.getFullYear(), followUp.getMonth(), followUp.getDate());
  const days = Math.round((startOfFollowUp - startOfToday) / 86400000);
  if (days < 0) return { label: "Overdue", tone: "overdue" };
  if (days === 0) return { label: "Today", tone: "today" };
  if (days === 1) return { label: "Tomorrow", tone: "tomorrow" };
  return {
    label: followUp.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    tone: "default",
  };
}