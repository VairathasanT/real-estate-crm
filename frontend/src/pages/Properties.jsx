import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Building2,
  Home,
  MapPin,
  X,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

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

export default function Properties() {
  const { user } = useAuth();
  const userRole = user?.role ?? user?.user?.role ?? "";
  const isAdmin =
    typeof userRole === "string" &&
    userRole.trim().toUpperCase() === "ADMIN";

  const [projects, setProjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [showBuildingModal, setShowBuildingModal] =
    useState(false);

  const [showUnitModal, setShowUnitModal] =
    useState(false);

  const [projectForm, setProjectForm] = useState(
    initialProjectForm
  );

  const [buildingForm, setBuildingForm] = useState(
    initialBuildingForm
  );

  const [unitForm, setUnitForm] = useState(
    initialUnitForm
  );

  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  const loadProjects = async () => {
    const response = await api.get("/projects");

    const data = response.data;

    setProjects(
      Array.isArray(data)
        ? data
        : data?.projects || []
    );
  };

  // =========================================================
  // LOAD BUILDINGS
  // =========================================================

  const loadBuildings = async () => {
    const response = await api.get("/buildings");

    const data = response.data;

    setBuildings(
      Array.isArray(data)
        ? data
        : data?.buildings || []
    );
  };

  // =========================================================
  // LOAD UNITS
  // =========================================================

  const loadUnits = async () => {
    const response = await api.get("/units");

    const data = response.data;

    setUnits(
      Array.isArray(data)
        ? data
        : data?.units || []
    );
  };

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

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

      setError(getApiErrorMessage(err, "Unable to load properties."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // =========================================================
  // PROJECT FORM
  // =========================================================

  const handleProjectChange = (e) => {
    const { name, value } = e.target;

    setProjectForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // BUILDING FORM
  // =========================================================

  const handleBuildingChange = (e) => {
    const { name, value } = e.target;

    setBuildingForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // UNIT FORM
  // =========================================================

  const handleUnitChange = (e) => {
    const { name, value } = e.target;

    setUnitForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // OPEN PROJECT MODAL
  // =========================================================

  const openProjectModal = () => {
    setProjectForm({
      ...initialProjectForm,
    });

    setError("");

    setShowProjectModal(true);
  };

  // =========================================================
  // OPEN BUILDING MODAL
  // =========================================================

  const openBuildingModal = () => {
    setBuildingForm({
      name: "",
      projectId:
        projects.length === 1
          ? String(projects[0].id)
          : "",
    });

    setError("");

    setShowBuildingModal(true);
  };

  // =========================================================
  // OPEN UNIT MODAL
  // =========================================================

  const openUnitModal = () => {
    setUnitForm({
      ...initialUnitForm,

      buildingId:
        buildings.length === 1
          ? String(buildings[0].id)
          : "",
    });

    setError("");

    setShowUnitModal(true);
  };

  // =========================================================
  // CLOSE MODALS
  // =========================================================

  const closeAllModals = () => {
    if (saving) return;

    setShowProjectModal(false);
    setShowBuildingModal(false);
    setShowUnitModal(false);
  };

  // =========================================================
  // CREATE PROJECT
  // =========================================================

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!projectForm.name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!projectForm.location.trim()) {
      setError("Project location is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/projects", {
        name: projectForm.name.trim(),
        location:
          projectForm.location.trim(),
        description:
          projectForm.description.trim() ||
          undefined,
      });

      setShowProjectModal(false);

      setProjectForm({
        ...initialProjectForm,
      });

      await loadProperties();
    } catch (err) {
      console.error(
        "CREATE PROJECT ERROR:",
        err
      );

      setError(getApiErrorMessage(err, "Unable to create project."));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CREATE BUILDING
  // =========================================================

  const handleCreateBuilding = async (e) => {
    e.preventDefault();

    if (!buildingForm.name.trim()) {
      setError("Building name is required.");
      return;
    }

    if (!buildingForm.projectId) {
      setError("Please select a project.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/buildings", {
        name: buildingForm.name.trim(),
        projectId: Number(
          buildingForm.projectId
        ),
      });

      setShowBuildingModal(false);

      setBuildingForm({
        ...initialBuildingForm,
      });

      await loadProperties();
    } catch (err) {
      console.error(
        "CREATE BUILDING ERROR:",
        err
      );

      setError(getApiErrorMessage(err, "Unable to create building."));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CREATE UNIT
  // =========================================================

  const handleCreateUnit = async (e) => {
    e.preventDefault();

    if (!unitForm.unitNumber.trim()) {
      setError("Unit number is required.");
      return;
    }

    if (!unitForm.type.trim()) {
      setError("Unit type is required.");
      return;
    }

    if (!unitForm.price) {
      setError("Unit price is required.");
      return;
    }

    if (!unitForm.buildingId) {
      setError("Please select a building.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.post("/units", {
        unitNumber:
          unitForm.unitNumber.trim(),

        type:
          unitForm.type.trim(),

        price: Number(
          unitForm.price
        ),

        status:
          unitForm.status,

        buildingId: Number(
          unitForm.buildingId
        ),
      });

      setShowUnitModal(false);

      setUnitForm({
        ...initialUnitForm,
      });

      await loadProperties();
    } catch (err) {
      console.error(
        "CREATE UNIT ERROR:",
        err
      );

      setError(getApiErrorMessage(err, "Unable to create unit."));
    } finally {
      setSaving(false);
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
  // STATUS CLASS
  // =========================================================

  const statusClass = (status) => {
    return `property-status status-${(
      status || "AVAILABLE"
    ).toLowerCase()}`;
  };

  const statusLabel = (status) =>
    (status || "AVAILABLE")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  // =========================================================
  // COUNTS
  // =========================================================

  const availableUnits = units.filter(
    (unit) =>
      unit.status === "AVAILABLE"
  ).length;

  const bookedUnits = units.filter(
    (unit) =>
      unit.status === "BOOKED"
  ).length;

  const soldUnits = units.filter(
    (unit) =>
      unit.status === "SOLD"
  ).length;

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page-container">

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="page-header">

        <div>
          <h1>Properties</h1>

          <p>
            Manage projects, buildings and units
          </p>
        </div>

        <div className="page-header-actions properties-actions">
          {isAdmin && (
            <>
              <button
                type="button"
                className="primary-button"
                onClick={openProjectModal}
              >
                <Plus size={17} />
                Add Project
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={openBuildingModal}
                disabled={projects.length === 0}
                title={projects.length === 0 ? "Create a project first" : undefined}
              >
                <Plus size={17} />
                Add Building
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={openUnitModal}
                disabled={buildings.length === 0}
                title={buildings.length === 0 ? "Create a building first" : undefined}
              >
                <Plus size={17} />
                Add Unit
              </button>
            </>
          )}
          <button
            type="button"
            className="refresh-button"
            onClick={loadProperties}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

      </div>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ===================================================
          SUMMARY
      ==================================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <Building2 size={22} />
          </div>

          <div>
            <span>
              Projects
            </span>

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
            <span>
              Buildings
            </span>

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

      {/* ===================================================
          PROJECTS
      ==================================================== */}

      <div className="section-header">

        <div>
          <h2>Projects</h2>

          <p>
            Property projects and locations
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
            Create your first property project.
          </p>

        </div>

      ) : (

        <div className="property-grid">

          {projects.map((project) => (

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

              <h3>
                {project.name}
              </h3>

              <div className="property-location">

                <MapPin size={16} />

                {project.location}

              </div>

              {project.description && (
                <p>
                  {project.description}
                </p>
              )}

              <div className="property-card-footer">

                <span>
                  {project.buildings
                    ?.length ||
                    buildings.filter(
                      (building) =>
                        building.projectId ===
                        project.id
                    ).length}{" "}
                  Buildings
                </span>

                <span>
                  {project.buildings
                    ?.reduce(
                      (total, building) =>
                        total +
                        (building.units
                          ?.length || 0),
                      0
                    ) ||
                    units.filter(
                      (unit) =>
                        unit.building
                          ?.projectId ===
                        project.id
                    ).length}{" "}
                  Units
                </span>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* ===================================================
          BUILDINGS
      ==================================================== */}

      <div className="section-header">

        <div>
          <h2>Buildings</h2>

          <p>
            Buildings within each project
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
            Create a building under a project.
          </p>

        </div>

      ) : (

        <div className="property-grid">

          {buildings.map((building) => (

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

              <h3>
                {building.name}
              </h3>

              <div className="property-location">

                <MapPin size={16} />

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

          ))}

        </div>
      )}

      {/* ===================================================
          UNITS
      ==================================================== */}

      <div className="section-header">

        <div>
          <h2>Units</h2>

          <p>
            Manage unit availability and pricing
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
            Add units to your buildings.
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
                </tr>

              </thead>

              <tbody>

                {units.map((unit) => (

                  <tr
                    key={unit.id}
                  >

                    <td>
                      <strong>
                        {unit.unitNumber}
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
                        {statusLabel(unit.status)}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ===================================================
          PROJECT MODAL
      ==================================================== */}

      {showProjectModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Add Project
                </h2>

                <p>
                  Create a new property project
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAllModals}
                disabled={saving}
                aria-label="Close project form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleCreateProject
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
                  required
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
                    ? "Creating..."
                    : "Create Project"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================
          BUILDING MODAL
      ==================================================== */}

      {showBuildingModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Add Building
                </h2>

                <p>
                  Add a building to a project
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAllModals}
                disabled={saving}
                aria-label="Close building form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleCreateBuilding
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
                  required
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
                    ? "Creating..."
                    : "Create Building"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================
          UNIT MODAL
      ==================================================== */}

      {showUnitModal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Add Unit
                </h2>

                <p>
                  Add a property unit
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAllModals}
                disabled={saving}
                aria-label="Close unit form"
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="lead-form"
              onSubmit={
                handleCreateUnit
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
                    required
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
                    required
                  />

                </div>

              </div>

              <div className="form-row">

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
                    required
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="unit-status">
                    Status
                  </label>

                  <select
                    id="unit-status"
                    name="status"
                    value={
                      unitForm.status
                    }
                    onChange={
                      handleUnitChange
                    }
                  >

                    <option value="AVAILABLE">
                      Available
                    </option>

                    <option value="BOOKED">
                      Booked
                    </option>

                    <option value="SOLD">
                      Sold
                    </option>

                  </select>

                </div>

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
                    ? "Creating..."
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