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

  const token = localStorage.getItem("token");

  // ✅ Toast
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // ✅ Fetch officers
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/admin/officers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOfficers(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load officers", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/system-health", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHealth(res.data);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to fetch system health", "error");
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    if (activeMenu === "health") fetchSystemHealth();
  }, [activeMenu]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ✅ Handle form input
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ✅ Modal handling
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

  // ✅ Save / Update officer
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOfficer) {
        await axios.put(
          `http://localhost:5000/admin/officers/${editingOfficer._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("✅ Officer updated successfully!", "success");
      } else {
        await axios.post("http://localhost:5000/admin/officers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("✅ Officer added successfully!", "success");
      }
      closeModal();
      fetchOfficers();
    } catch (err) {
      showToast("❌ Error saving officer", "error");
    }
  };

  // ✅ Delete officer
  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this officer?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/admin/officers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOfficers();
      showToast("🗑 Officer deleted successfully!", "success");
    } catch (err) {
      showToast("❌ Failed to delete officer.", "error");
    }
  };

  // ✅ Render content
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="p-4 text-white">
            <h2 className="fw-bold mb-4">Welcome, Admin 👋</h2>
            <div className="row g-4 mb-4">
              {[
                { title: "Total Officers", value: officers.length, color: "primary" },
                {
                  title: "Admins",
                  value: officers.filter((o) => o.role === "admin").length,
                  color: "warning",
                },
                { title: "Violations", value: "128", color: "danger" },
                { title: "Challans", value: "94", color: "success" },
              ].map((card, i) => (
                <div className="col-md-3" key={i}>
                  <div className="card bg-dark border-0 shadow-lg text-center">
                    <div className="card-body">
                      <h5 className="text-secondary mb-2">{card.title}</h5>
                      <h2 className={`fw-bold text-${card.color}`}>{card.value}</h2>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "health":
        return (
          <div className="p-4 text-white">
            <h2 className="fw-bold mb-4">
              <FaHeartbeat className="me-2 text-danger" />
              System Health Overview
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

      default:
        return null;
    }
  };

  // ✅ Layout
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
          {[["dashboard", "Dashboard", <FaTachometerAlt className="me-2" />],
            ["officers", "Officers", <FaUsers className="me-2" />],
            ["health", "System Health", <FaHeartbeat className="me-2" />]
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

      {/* Main content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 250 }}>
        <nav className="navbar navbar-dark bg-dark shadow-sm px-4">
          <h4 className="fw-bold text-white mb-0">🚔 Admin Dashboard</h4>
        </nav>
        <div className="p-4 overflow-auto">{renderContent()}</div>
      </div>

      {/* ✅ Modal Popup */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  {editingOfficer ? "Edit Officer" : "Add Officer"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
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
                        editingOfficer ? "Leave blank to keep same" : ""
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
                </div>

                <div className="modal-footer border-secondary">
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
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`toast-box ${toast.type}`}>
          <p>{toast.message}</p>
        </div>
      )}

      {/* ✅ Custom CSS */}
      <style>{`
        .sidebar-btn {
          color: #ddd;
          font-weight: 500;
          width: 100%;
          text-align: left;
          transition: 0.3s;
        }
        .sidebar-btn:hover, .sidebar-btn.active {
          background-color: #0d6efd;
          color: white !important;
          border-radius: 8px;
        }
        .toast-box {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(25,25,25,0.95);
          border-left: 4px solid #0d6efd;
          padding: 12px 18px;
          color: white;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          z-index: 3000;
          animation: slideIn 0.4s ease;
        }
        .toast-box.success { border-left-color: #28a745; }
        .toast-box.error { border-left-color: #dc3545; }
        .toast-box.info { border-left-color: #0d6efd; }
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
