import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUsers,
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaSignOutAlt,
  FaTachometerAlt,
  FaHeartbeat,
} from "react-icons/fa";
import officerImage from "../assets/officer.jpg";
import "bootstrap/dist/css/bootstrap.min.css";

// Charts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0d6efd", "#ffc107", "#dc3545", "#20c997", "#6610f2"];

export default function AdminDashboard() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "officer",
    location: "",
  });
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ totalViolations: 0, totalChallans: 0 });
  const [chartTypeData, setChartTypeData] = useState([]);
  const [chartLocationData, setChartLocationData] = useState([]);

  const token = localStorage.getItem("token");

  // Toast
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch officers
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/admin/officers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOfficers(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load officers", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/system-health", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealth(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch system health", "error");
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load stats", "error");
    }
  };

  // Fetch charts
  const fetchChartData = async () => {
    try {
      const [typeRes, locRes] = await Promise.all([
        axios.get("http://localhost:5000/admin/violations-by-type", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/admin/violations-by-location", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setChartTypeData(typeRes.data);
      setChartLocationData(locRes.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load chart data", "error");
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    if (activeMenu === "dashboard") {
      fetchStats();
      fetchChartData();
    }
    if (activeMenu === "health") fetchSystemHealth();
  }, [activeMenu]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Input change
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Open Modal
  const openModal = (officer = null) => {
    if (officer) {
      setEditingOfficer(officer);
      setFormData({
        name: officer.name,
        email: officer.email,
        password: "",
        role: officer.role,
        location: officer.location || "",
      });
    } else {
      setEditingOfficer(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "officer",
        location: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Save/Update Officer
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOfficer) {
        await axios.put(
          `http://localhost:5000/admin/officers/${editingOfficer._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("Officer updated successfully!", "success");
      } else {
        await axios.post("http://localhost:5000/admin/officers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Officer added successfully!", "success");
      }
      closeModal();
      fetchOfficers();
    } catch (err) {
      showToast("Error saving officer", "error");
    }
  };

  // Delete officer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this officer?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/admin/officers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOfficers();
      showToast("🗑 Officer deleted successfully!", "success");
    } catch (err) {
      showToast("Failed to delete officer.", "error");
    }
  };

  // Render Officer Modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div
        className="modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
        }}
      >
        <div
          className="modal-content bg-dark text-white p-4 rounded border border-secondary"
          style={{ width: "400px", maxWidth: "90%" }}
        >
          <h5 className="mb-3">
            {editingOfficer ? "Edit Officer" : "Add Officer"}
          </h5>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control bg-dark text-white border-secondary"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control bg-dark text-white border-secondary"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  editingOfficer ? "Leave blank to keep same" : "Enter password"
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Role</label>
              <select
                className="form-select bg-dark text-white border-secondary"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingOfficer ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render Content
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="p-4 text-white">
            <h2 className="fw-bold mb-4">Welcome, Admin</h2>

            {/* Cards */}
            <div className="row g-4 mb-4">
              {[
                { title: "Total Officers", value: officers.length, color: "primary" },
                { title: "Admins", value: officers.filter((o) => o.role === "admin").length, color: "warning" },
                { title: "Violations", value: stats.totalViolations, color: "danger" },
                { title: "Challans", value: stats.totalChallans, color: "success" },
              ].map((card, i) => (
                <div className="col-md-3" key={i}>
                  <div className="card bg-dark border-0 shadow-lg text-center">
                    <div className="card-body">
                      <h5 className="text-secondary mb-2">{card.title}</h5>
                      <h2 className={`fw-bold text-${card.color}`}>
                        {card.value}
                      </h2>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="row g-4 mt-3">
              <div className="col-md-6">
                <div className="card bg-dark border-0 shadow-lg p-3">
                  <h5 className="text-center text-info mb-3">
                    Violations by Type
                  </h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartTypeData}>
                      <XAxis dataKey="type" stroke="#ccc" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#0d6efd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card bg-dark border-0 shadow-lg p-3">
                  <h5 className="text-center text-info mb-3">
                    Violations by Location
                  </h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartLocationData}
                        dataKey="count"
                        nameKey="location"
                        outerRadius={80}
                        label
                      >
                        {chartLocationData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case "officers":
        return (
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="text-white fw-bold">
                <FaUsers className="me-2" /> Officer Management
              </h3>
              <button
                className="btn btn-primary fw-semibold"
                onClick={() => openModal()}
              >
                <FaPlusCircle className="me-2" /> Add Officer
              </button>
            </div>

            <div className="table-responsive bg-dark rounded p-3 shadow">
              {loading ? (
                <p className="text-center text-secondary py-4">
                  Loading officers...
                </p>
              ) : officers.length === 0 ? (
                <p className="text-center text-secondary py-4">
                  No officers found.
                </p>
              ) : (
                <table className="table table-dark table-hover align-middle mb-0">
                  <thead className="table-primary text-dark">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((officer, index) => (
                      <tr key={officer._id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">{officer.name}</td>
                        <td>{officer.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              officer.role === "admin"
                                ? "bg-warning text-dark"
                                : "bg-info"
                            }`}
                          >
                            {officer.role}
                          </span>
                        </td>
                        <td>{officer.location || "—"}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => openModal(officer)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(officer._id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      case "health":
        return (
          <div className="p-4 text-white">
            <h2 className="fw-bold mb-4">
              <FaHeartbeat className="me-2 text-danger" /> System Health Overview
            </h2>
            {!health ? (
              <p className="text-secondary">Fetching live system data...</p>
            ) : (
              <div className="row g-4">
                {Object.entries({
                  "Database Status": health.database?.status || "Unknown",
                  "Uptime (Hours)": health.uptimeHours || "0",
                  "Memory Usage (%)": health.usedMemPercent || "N/A",
                  "CPU Cores": health.numCPUs || "N/A",
                  "Node.js Version": health.nodeVersion || "N/A",
                  "System Status": health.systemStatus || "OK",
                }).map(([title, value], i) => (
                  <div className="col-md-3" key={i}>
                    <div className="card bg-dark border-0 shadow-lg h-100 text-center p-3">
                      <h6 className="text-secondary">{title}</h6>
                      <p className="text-info fw-bold">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="d-flex vh-100 bg-black text-white">
      {/* Sidebar */}
      <aside
        className="d-flex flex-column p-3 position-fixed top-0 bottom-0 bg-dark border-end border-secondary"
        style={{ width: 250 }}
      >
        <div className="text-center mb-4">
          <img
            src={officerImage}
            alt="Admin"
            className="rounded-circle mb-2 border border-secondary"
            width="80"
            height="80"
          />
          <h5 className="fw-bold">System Admin</h5>
        </div>

        <ul className="nav flex-column flex-grow-1">
          {[
            ["dashboard", "Dashboard", <FaTachometerAlt className="me-2" />],
            ["officers", "Officers", <FaUsers className="me-2" />],
            ["health", "System Health", <FaHeartbeat className="me-2" />],
          ].map(([key, label, icon]) => (
            <li className="nav-item mb-2" key={key}>
              <button
                onClick={() => setActiveMenu(key)}
                className={`nav-link btn btn-link sidebar-btn ${
                  activeMenu === key ? "active" : ""
                }`}
              >
                {icon} {label}
              </button>
            </li>
          ))}

          <li className="nav-item mt-auto">
            <button
              onClick={handleLogout}
              className="nav-link btn btn-link text-danger sidebar-btn"
            >
              <FaSignOutAlt className="me-2" /> Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ marginLeft: 250 }}
      >
        <nav className="navbar navbar-dark bg-dark shadow-sm px-4">
          <h4 className="fw-bold text-white mb-0">🚔 Admin Dashboard</h4>
        </nav>
        <div className="p-4 overflow-auto">{renderContent()}</div>
      </div>

      {/* Modal */}
      {renderModal()}

      {/* Toast */}
      {toast.show && (
        <div
          className={`toast align-items-center text-bg-${
            toast.type === "error" ? "danger" : toast.type
          } border-0 position-fixed bottom-0 end-0 m-3 show`}
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold">{toast.message}</div>
          </div>
        </div>
      )}

      {/* Sidebar CSS Fix */}
      <style>{`
        .sidebar-btn {
          color: white !important;
          text-align: left;
          width: 100%;
          font-weight: 500;
        }
        .sidebar-btn:hover {
          color: #aaa !important;
        }
        .sidebar-btn.active {
          color: #fff !important;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
        }
        .sidebar-btn:focus,
        .sidebar-btn:active {
          color: #fff !important;
          text-decoration: none !important;
        }
      `}</style>
    </div>
  );
}
