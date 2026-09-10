



import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Building2,
  Home,
  MapPin,
  X,
  Pencil,
} from "lucide-react";

import api, {
  getApiErrorMessage,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

// ============================================================
// INITIAL FORMS
// ============================================================

const initialProjectForm = {
  name: "",
  location: "",
  description: "",
};

const initialBuildingForm = {
  name: "",
  projectId: "",
};

const initialUnitForm = {
  unitNumber: "",
  type: "",
  price: "",
  status: "AVAILABLE",
  buildingId: "",
};

// ============================================================
// COMPONENT
// ============================================================

export default function Properties() {
  const { user } = useAuth();

  const userRole =
    user?.role ??
    user?.user?.role ??
    "";

  const isAdmin =
    typeof userRole === "string" &&
    userRole.trim().toUpperCase() ===
      "ADMIN";

  // ==========================================================
  // DATA
  // ==========================================================

  const [projects, setProjects] =
    useState([]);

  const [buildings, setBuildings] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // MODALS
  // ==========================================================

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [showBuildingModal, setShowBuildingModal] =
    useState(false);

  const [showUnitModal, setShowUnitModal] =
    useState(false);

  // ==========================================================
  // EDIT MODE
  // ==========================================================

  const [editingProject, setEditingProject] =
    useState(null);

  const [editingBuilding, setEditingBuilding] =
    useState(null);

  const [editingUnit, setEditingUnit] =
    useState(null);

  // ==========================================================
  // FORMS
  // ==========================================================

  const [projectForm, setProjectForm] =
    useState(initialProjectForm);

  const [buildingForm, setBuildingForm] =
    useState(initialBuildingForm);

  const [unitForm, setUnitForm] =
    useState(initialUnitForm);

  // ==========================================================
  // LOAD PROJECTS
  // ==========================================================

  const loadProjects = async () => {
    const response =
      await api.get("/projects");

    const data = response.data;

    setProjects(
      Array.isArray(data)
        ? data
        : data?.projects || []
    );
  };

  // ==========================================================
  // LOAD BUILDINGS
  // ==========================================================

  const loadBuildings = async () => {
    const response =
      await api.get("/buildings");

    const data = response.data;

    setBuildings(
      Array.isArray(data)
        ? data
        : data?.buildings || []
    );
  };

  // ==========================================================
  // LOAD UNITS
  // ==========================================================

  const loadUnits = async () => {
    const response =
      await api.get("/units");

    const data = response.data;

    setUnits(
      Array.isArray(data)
        ? data
        : data?.units || []
    );
  };

  // ==========================================================
  // LOAD EVERYTHING
  // ==========================================================

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadProjects(),
        loadBuildings(),
        loadUnits(),
      ]);
    } catch (err) {
      console.error(
        "LOAD PROPERTIES ERROR:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to load properties."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccess = (message) => {
    setError("");
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3500);
  };

  const handleError = (
    err,
    fallback
  ) => {
    console.error(err);

    setSuccess("");

    setError(
      getApiErrorMessage(
        err,
        fallback
      )
    );
  };

  // ==========================================================
  // PROJECT FORM
  // ==========================================================

  const handleProjectChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setProjectForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================================
  // BUILDING FORM
  // ==========================================================

  const handleBuildingChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setBuildingForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================================
  // UNIT FORM
  // ==========================================================

  const handleUnitChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setUnitForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================================
  // PROJECT CREATE
  // ==========================================================

  const openCreateProjectModal = () => {
    if (!isAdmin) return;

    setEditingProject(null);

    setProjectForm({
      ...initialProjectForm,
    });

    clearMessages();

    setShowProjectModal(true);
  };

  // ==========================================================
  // PROJECT EDIT
  // ==========================================================

  const openEditProjectModal = (
    project
  ) => {
    if (!isAdmin) return;

    setEditingProject(project);

    setProjectForm({
      name: project.name || "",
      location:
        project.location || "",
      description:
        project.description || "",
    });

    clearMessages();

    setShowProjectModal(true);
  };

  // ==========================================================
  // BUILDING CREATE
  // ==========================================================

  const openCreateBuildingModal = () => {
    if (!isAdmin) return;

    if (projects.length === 0) {
      setError(
        "Create a project before adding a building."
      );
      return;
    }

    setEditingBuilding(null);

    setBuildingForm({
      name: "",
      projectId:
        projects.length === 1
          ? String(projects[0].id)
          : "",
    });

    clearMessages();

    setShowBuildingModal(true);
  };

  // ==========================================================
  // BUILDING EDIT
  // ==========================================================

  const openEditBuildingModal = (
    building
  ) => {
    if (!isAdmin) return;

    setEditingBuilding(building);

    setBuildingForm({
      name: building.name || "",
      projectId: String(
        building.projectId
      ),
    });

    clearMessages();

    setShowBuildingModal(true);
  };

  // ==========================================================
  // UNIT CREATE
  // ==========================================================

  const openCreateUnitModal = () => {
    if (!isAdmin) return;

    if (buildings.length === 0) {
      setError(
        "Create a building before adding a unit."
      );
      return;
    }

    setEditingUnit(null);

    setUnitForm({
      ...initialUnitForm,
      buildingId:
        buildings.length === 1
          ? String(buildings[0].id)
          : "",
    });

    clearMessages();

    setShowUnitModal(true);
  };

  // ==========================================================
  // UNIT EDIT
  // ==========================================================

  const openEditUnitModal = (
    unit
  ) => {
    if (!isAdmin) return;

    setEditingUnit(unit);

    setUnitForm({
      unitNumber:
        unit.unitNumber || "",

      type:
        unit.type || "",

      price:
        unit.price !== undefined &&
        unit.price !== null
          ? String(unit.price)
          : "",

      status:
        unit.status || "AVAILABLE",

      buildingId:
        String(unit.buildingId),
    });

    clearMessages();

    setShowUnitModal(true);
  };

  // ==========================================================
  // CLOSE MODALS
  // ==========================================================

  const closeAllModals = () => {
    if (saving) return;

    setShowProjectModal(false);
    setShowBuildingModal(false);
    setShowUnitModal(false);

    setEditingProject(null);
    setEditingBuilding(null);
    setEditingUnit(null);
  };

  // ==========================================================
  // SAVE PROJECT
  // ==========================================================

  const handleProjectSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!isAdmin) return;

    const name =
      projectForm.name.trim();

    const location =
      projectForm.location.trim();

    if (!name) {
      setError(
        "Project name is required."
      );
      return;
    }

    if (!location) {
      setError(
        "Project location is required."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const payload = {
        name,
        location,
        description:
          projectForm.description.trim() ||
          undefined,
      };

      if (editingProject) {
        await api.put(
          `/projects/${editingProject.id}`,
          payload
        );

        setShowProjectModal(false);

        showSuccess(
          "Project updated successfully."
        );
      } else {
        await api.post(
          "/projects",
          payload
        );

        setShowProjectModal(false);

        showSuccess(
          "Project created successfully."
        );
      }

      setProjectForm({
        ...initialProjectForm,
      });

      setEditingProject(null);

      await loadProperties();
    } catch (err) {
      handleError(
        err,
        editingProject
          ? "Unable to update project."
          : "Unable to create project."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // SAVE BUILDING
  // ==========================================================

  const handleBuildingSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!isAdmin) return;

    const name =
      buildingForm.name.trim();

    if (!name) {
      setError(
        "Building name is required."
      );
      return;
    }

    if (!buildingForm.projectId) {
      setError(
        "Please select a project."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      if (editingBuilding) {
        /*
         * Project is intentionally not editable
         * here. Moving an existing building to another
         * project could create confusing unit ownership.
         */
        await api.put(
          `/buildings/${editingBuilding.id}`,
          {
            name,
          }
        );

        setShowBuildingModal(false);

        showSuccess(
          "Building updated successfully."
        );
      } else {
        await api.post(
          "/buildings",
          {
            name,
            projectId: Number(
              buildingForm.projectId
            ),
          }
        );

        setShowBuildingModal(false);

        showSuccess(
          "Building created successfully."
        );
      }

      setBuildingForm({
        ...initialBuildingForm,
      });

      setEditingBuilding(null);

      await loadProperties();
    } catch (err) {
      handleError(
        err,
        editingBuilding
          ? "Unable to update building."
          : "Unable to create building."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // SAVE UNIT
  // ==========================================================

  const handleUnitSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!isAdmin) return;

    const unitNumber =
      unitForm.unitNumber.trim();

    const type =
      unitForm.type.trim();

    const price = Number(
      unitForm.price
    );

    if (!unitNumber) {
      setError(
        "Unit number is required."
      );
      return;
    }

    if (!type) {
      setError(
        "Unit type is required."
      );
      return;
    }

    if (
      unitForm.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Enter a valid unit price."
      );
      return;
    }

    if (!unitForm.buildingId) {
      setError(
        "Please select a building."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      if (editingUnit) {
        /*
         * IMPORTANT:
         *
         * We intentionally do NOT send status.
         *
         * Booking state is controlled by the booking
         * transaction, not the property editor.
         */
        await api.put(
          `/units/${editingUnit.id}`,
          {
            unitNumber,
            type,
            price,
          }
        );

        setShowUnitModal(false);

        showSuccess(
          "Unit updated successfully."
        );
      } else {
        await api.post(
          "/units",
          {
            unitNumber,
            type,
            price,
            buildingId: Number(
              unitForm.buildingId
            ),
          }
        );

        setShowUnitModal(false);

        showSuccess(
          "Unit created successfully."
        );
      }

      setUnitForm({
        ...initialUnitForm,
      });

      setEditingUnit(null);

      await loadProperties();
    } catch (err) {
      handleError(
        err,
        editingUnit
          ? "Unable to update unit."
          : "Unable to create unit."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // FORMAT PRICE
  // ==========================================================

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return "₹0";
    }

    const numericPrice =
      Number(price);

    if (!Number.isFinite(numericPrice)) {
      return "₹0";
    }

    return numericPrice.toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    );
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const statusClass = (
    status
  ) => {
    return `property-status status-${(
      status || "AVAILABLE"
    ).toLowerCase()}`;
  };

  const statusLabel = (
    status
  ) =>
    (status || "AVAILABLE")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  // ==========================================================
  // COUNTS
  // ==========================================================

  const availableUnits =
    units.filter(
      (unit) =>
        unit.status ===
        "AVAILABLE"
    ).length;

  const bookedUnits =
    units.filter(
      (unit) =>
        unit.status === "BOOKED"
    ).length;

  const soldUnits =
    units.filter(
      (unit) =>
        unit.status === "SOLD"
    ).length;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="page-container">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="page-header">

        <div>
          <h1>Properties</h1>

          <p>
            Manage projects, buildings
            and units
          </p>
        </div>

        <div className="page-header-actions properties-actions">

          {isAdmin && (
            <>
              <button
                type="button"
                className="primary-button"
                onClick={
                  openCreateProjectModal
                }
              >
                <Plus size={17} />
                Add Project
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={
                  openCreateBuildingModal
                }
                disabled={
                  projects.length === 0
                }
                title={
                  projects.length === 0
                    ? "Create a project first"
                    : undefined
                }
              >
                <Plus size={17} />
                Add Building
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={
                  openCreateUnitModal
                }
                disabled={
                  buildings.length === 0
                }
                title={
                  buildings.length === 0
                    ? "Create a building first"
                    : undefined
                }
              >
                <Plus size={17} />
                Add Unit
              </button>
            </>
          )}

          <button
            type="button"
            className="refresh-button"
            onClick={
              loadProperties
            }
            disabled={loading}
          >
            <RefreshCw
              size={17}
            />

            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* ====================================================
          SUCCESS
      ==================================================== */}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={22} />
          </div>

          <div>
            <span>Projects</span>
            <strong>
              {projects.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={22} />
          </div>

          <div>
            <span>Buildings</span>
            <strong>
              {buildings.length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Home size={22} />
          </div>

          <div>
            <span>
              Available Units
            </span>
            <strong>
              {availableUnits}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Home size={22} />
          </div>

          <div>
            <span>
              Booked Units
            </span>
            <strong>
              {bookedUnits}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Home size={22} />
          </div>

          <div>
            <span>
              Sold Units
            </span>
            <strong>
              {soldUnits}
            </strong>
          </div>
        </div>

      </div>

      {/* ====================================================
          PROJECTS
      ==================================================== */}

      <div className="section-header">
        <div>
          <h2>Projects</h2>

          <p>
            Property projects and
            locations
          </p>
        </div>
      </div>

      {projects.length === 0 ? (

        <div className="dashboard-card empty-state">
          <Building2 size={36} />

          <h3>
            No projects yet
          </h3>

          <p>
            Create your first
            property project.
          </p>
        </div>

      ) : (

        <div className="property-grid">

          {projects.map(
            (project) => (

              <div
                className="property-card"
                key={project.id}
              >

                <div className="property-card-header">

                  <div className="property-icon">
                    <Building2
                      size={22}
                    />
                  </div>

                  <span>
                    #{project.id}
                  </span>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                  }}
                >

                  <h3>
                    {project.name}
                  </h3>

                  {isAdmin && (
                    <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    >
                      <button
                      type="button"
                      className="view-button"
                      onClick={() =>
                        openEditProjectModal(project)
                      }
                      title="Edit project"
                      aria-label={`Edit ${project.name}`}
                      >
                        <Pencil size={16} />
                        </button>
                        </div>
                      )}

                </div>

                <div className="property-location">

                  <MapPin
                    size={16}
                  />

                  {project.location}

                </div>

                {project.description && (
                  <p>
                    {
                      project.description
                    }
                  </p>
                )}

                <div className="property-card-footer">

                  <span>
                    {project.buildings
                      ?.length ||
                      buildings.filter(
                        (
                          building
                        ) =>
                          building.projectId ===
                          project.id
                      ).length}{" "}
                    Buildings
                  </span>

                  <span>
                    {project.buildings
                      ?.reduce(
                        (
                          total,
                          building
                        ) =>
                          total +
                          (
                            building
                              .units
                              ?.length ||
                            0
                          ),
                        0
                      ) ||
                      units.filter(
                        (unit) =>
                          unit
                            .building
                            ?.projectId ===
                          project.id
                      ).length}{" "}
                    Units
                  </span>

                </div>

              </div>

            )
          )}

        </div>
      )}

      {/* ====================================================
          BUILDINGS
      ==================================================== */}

      <div className="section-header">

        <div>
          <h2>Buildings</h2>

          <p>
            Buildings within each
            project
          </p>
        </div>

      </div>

      {buildings.length === 0 ? (

        <div className="dashboard-card empty-state">

          <Building2 size={36} />

          <h3>
            No buildings yet
          </h3>

          <p>
            Create a building under
            a project.
          </p>

        </div>

      ) : (

        <div className="property-grid">

          {buildings.map(
            (building) => (

              <div
                className="property-card"
                key={building.id}
              >

                <div className="property-card-header">

                  <div className="property-icon">
                    <Building2
                      size={22}
                    />
                  </div>

                  <span>
                    #{building.id}
                  </span>

                </div>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                  }}
                >

                  <h3>
                    {building.name}
                  </h3>

                  {isAdmin && (
                    <button
                      type="button"
                      className="view-button"
                      onClick={() =>
                        openEditBuildingModal(building)
                      }
                      title="Edit building"
                      aria-label={`Edit ${building.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                  )}

                </div>

                <div className="property-location">

                  <MapPin
                    size={16}
                  />

                  {building.project
                    ?.name ||
                    "Unknown Project"}

                </div>

                <div className="property-card-footer">

                  <span>
                    {building.units
                      ?.length ||
                      units.filter(
                        (unit) =>
                          unit.buildingId ===
                          building.id
                      ).length}{" "}
                    Units
                  </span>

                </div>

              </div>

            )
          )}

        </div>
      )}

      {/* ====================================================
          UNITS
      ==================================================== */}

      <div className="section-header">

        <div>
          <h2>Units</h2>

          <p>
            Manage unit availability
            and pricing
          </p>
        </div>

      </div>

      {units.length === 0 ? (

        <div className="dashboard-card empty-state">

          <Home size={36} />

          <h3>
            No units yet
          </h3>

          <p>
            Add units to your
            buildings.
          </p>

        </div>

      ) : (

        <div className="dashboard-card">

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Unit</th>
                  <th>Project</th>
                  <th>Building</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>

                  {isAdmin && (
                    <th>Action</th>
                  )}
                </tr>

              </thead>

              <tbody>

                {units.map(
                  (unit) => (

                    <tr
                      key={unit.id}
                    >

                      <td>
                        <strong>
                          {
                            unit.unitNumber
                          }
                        </strong>
                      </td>

                      <td>
                        {unit.building
                          ?.project
                          ?.name ||
                          "-"}
                      </td>

                      <td>
                        {unit.building
                          ?.name ||
                          "-"}
                      </td>

                      <td>
                        {unit.type}
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            unit.price
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={statusClass(
                            unit.status
                          )}
                        >
                          {statusLabel(
                            unit.status
                          )}
                        </span>
                      </td>

                      
                      {isAdmin && (
                        <td>
                          <button
                          type="button"
                          className="view-button"
                          onClick={() =>
                            openEditUnitModal(unit)
                          }
                          title="Edit unit"
                          aria-label={`Edit unit ${unit.unitNumber}`}
                          >
                            <Pencil size={16} />
                            </button>
                            </td>
                          )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ====================================================
          PROJECT MODAL
      ==================================================== */}

      {showProjectModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeAllModals();
            }
          }}
        >

          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >

            <div className="modal-header">

              <div>
                <h2 id="project-modal-title">
                  {editingProject
                    ? "Edit Project"
                    : "Add Project"}
                </h2>

                <p>
                  {editingProject
                    ? "Update project information"
                    : "Create a new property project"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeAllModals
                }
                disabled={saving}
                aria-label="Close project form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleProjectSubmit
              }
            >

              <div className="form-group">

                <label htmlFor="project-name">
                  Project Name *
                </label>

                <input
                  id="project-name"
                  type="text"
                  name="name"
                  value={
                    projectForm.name
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Green Valley Residency"
                  maxLength={150}
                  required
                  autoFocus
                />

              </div>

              <div className="form-group">

                <label htmlFor="project-location">
                  Location *
                </label>

                <input
                  id="project-location"
                  type="text"
                  name="location"
                  value={
                    projectForm.location
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Chennai"
                  maxLength={150}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="project-description">
                  Description
                </label>

                <textarea
                  id="project-description"
                  name="description"
                  value={
                    projectForm.description
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Project description..."
                  rows="4"
                  maxLength={1000}
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeAllModals
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
                    ? editingProject
                      ? "Saving..."
                      : "Creating..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================
          BUILDING MODAL
      ==================================================== */}

      {showBuildingModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeAllModals();
            }
          }}
        >

          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="building-modal-title"
          >

            <div className="modal-header">

              <div>
                <h2 id="building-modal-title">
                  {editingBuilding
                    ? "Edit Building"
                    : "Add Building"}
                </h2>

                <p>
                  {editingBuilding
                    ? "Update building information"
                    : "Add a building to a project"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeAllModals
                }
                disabled={saving}
                aria-label="Close building form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleBuildingSubmit
              }
            >

              <div className="form-group">

                <label htmlFor="building-project">
                  Project *
                </label>

                <select
                  id="building-project"
                  name="projectId"
                  value={
                    buildingForm.projectId
                  }
                  onChange={
                    handleBuildingChange
                  }
                  disabled={
                    Boolean(
                      editingBuilding
                    )
                  }
                  required
                >

                  <option value="">
                    Select project
                  </option>

                  {projects.map(
                    (project) => (

                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.name}
                      </option>

                    )
                  )}

                </select>

                {editingBuilding && (
                  <small>
                    The project cannot be
                    changed after a building
                    is created.
                  </small>
                )}

              </div>

              <div className="form-group">

                <label htmlFor="building-name">
                  Building Name *
                </label>

                <input
                  id="building-name"
                  type="text"
                  name="name"
                  value={
                    buildingForm.name
                  }
                  onChange={
                    handleBuildingChange
                  }
                  placeholder="Tower A"
                  maxLength={100}
                  required
                  autoFocus
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeAllModals
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
                    ? editingBuilding
                      ? "Saving..."
                      : "Creating..."
                    : editingBuilding
                      ? "Save Changes"
                      : "Create Building"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================
          UNIT MODAL
      ==================================================== */}

      {showUnitModal && (

        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeAllModals();
            }
          }}
        >

          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-modal-title"
          >

            <div className="modal-header">

              <div>
                <h2 id="unit-modal-title">
                  {editingUnit
                    ? "Edit Unit"
                    : "Add Unit"}
                </h2>

                <p>
                  {editingUnit
                    ? "Update unit details"
                    : "Add a property unit"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeAllModals
                }
                disabled={saving}
                aria-label="Close unit form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleUnitSubmit
              }
            >

              <div className="form-group">

                <label htmlFor="unit-building">
                  Building *
                </label>

                <select
                  id="unit-building"
                  name="buildingId"
                  value={
                    unitForm.buildingId
                  }
                  onChange={
                    handleUnitChange
                  }
                  disabled={
                    Boolean(editingUnit)
                  }
                  required
                >

                  <option value="">
                    Select building
                  </option>

                  {buildings.map(
                    (building) => (

                      <option
                        key={building.id}
                        value={building.id}
                      >
                        {building.project
                          ?.name
                          ? `${building.project.name} - `
                          : ""}
                        {building.name}
                      </option>

                    )
                  )}

                </select>

                {editingUnit && (
                  <small>
                    The building cannot be
                    changed after a unit is
                    created.
                  </small>
                )}

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="unit-number">
                    Unit Number *
                  </label>

                  <input
                    id="unit-number"
                    type="text"
                    name="unitNumber"
                    value={
                      unitForm.unitNumber
                    }
                    onChange={
                      handleUnitChange
                    }
                    placeholder="A-101"
                    maxLength={50}
                    required
                    autoFocus
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="unit-type">
                    Type *
                  </label>

                  <input
                    id="unit-type"
                    type="text"
                    name="type"
                    value={
                      unitForm.type
                    }
                    onChange={
                      handleUnitChange
                    }
                    placeholder="2BHK"
                    maxLength={50}
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <label htmlFor="unit-price">
                  Price *
                </label>

                <input
                  id="unit-price"
                  type="number"
                  name="price"
                  value={
                    unitForm.price
                  }
                  onChange={
                    handleUnitChange
                  }
                  placeholder="6500000"
                  min="0"
                  step="0.01"
                  required
                />

              </div>

              {/* ==================================================
                  STATUS
              ================================================== */}

              {editingUnit ? (

                <div className="form-group">

                  <label>
                    Current Status
                  </label>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding:
                        "10px 12px",
                      border:
                        "1px solid var(--border-color, #ddd)",
                      borderRadius:
                        "8px",
                    }}
                  >

                    <span
                      className={statusClass(
                        unitForm.status
                      )}
                    >
                      {statusLabel(
                        unitForm.status
                      )}
                    </span>

                  </div>

                  <small>
                    Unit availability is
                    controlled by the booking
                    workflow and cannot be
                    manually changed here.
                  </small>

                </div>

              ) : (

                <div className="form-group">

                  <label>
                    Initial Status
                  </label>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding:
                        "10px 12px",
                      border:
                        "1px solid var(--border-color, #ddd)",
                      borderRadius:
                        "8px",
                    }}
                  >

                    <span
                      className={statusClass(
                        "AVAILABLE"
                      )}
                    >
                      Available
                    </span>

                  </div>

                  <small>
                    New units are created as
                    Available. Booking changes
                    the status automatically.
                  </small>

                </div>

              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeAllModals
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
                    ? editingUnit
                      ? "Saving..."
                      : "Creating..."
                    : editingUnit
                      ? "Save Changes"
                      : "Create Unit"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}