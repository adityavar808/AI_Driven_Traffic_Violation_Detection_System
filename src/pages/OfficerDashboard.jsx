import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaTachometerAlt,
  FaCamera,
  FaFileAlt,
  FaExclamationTriangle,
  FaCarCrash,
  FaSignOutAlt,
} from "react-icons/fa";
import officerImage from "../assets/officer.jpg";
import axios from "axios";

export default function OfficerDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [violations, setViolations] = useState([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [officerName, setOfficerName] = useState("");
  const [loadingOfficer, setLoadingOfficer] = useState(true);

  const itemsPerPage = 8;

  // 🖥️ Responsive screen restriction
  useEffect(() => {
    const checkScreenSize = () => setIsRestricted(window.innerWidth <= 1232);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // 👮 Fetch officer info
  useEffect(() => {
    const fetchOfficerInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOfficerName(res.data.name || "Officer");
      } catch (err) {
        console.error("Error fetching officer info:", err.response?.data || err.message);
        setOfficerName("Officer");
      } finally {
        setLoadingOfficer(false);
      }
    };
    fetchOfficerInfo();
  }, []);

  // 🚔 Fetch violations filtered by officer’s location
  const fetchViolations = async () => {
    try {
      setViolationsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("http://localhost:5000/officer/violations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViolations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching violations:", err.response?.data || err.message);
      setViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  useEffect(() => {
    if (activeMenu === "violations" && violations.length === 0) {
      fetchViolations();
    }
  }, [activeMenu]);

  const total = violations.length;
  const red = violations.filter((v) => v.type === "redlight").length;
  const seatbelt = violations.filter((v) => v.type === "seatbelt").length;
  const overspeed = violations.filter((v) => v.type === "overspeed").length;

  const recentViolations = [...violations]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = violations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(violations.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  if (isRestricted) {
    return (
      <div className="restricted-message">
        <FaExclamationTriangle size={60} />
        <p>
          This dashboard is only available on larger screens. Please use a laptop
          or desktop for the best experience.
        </p>
      </div>
    );
  }

  // 🎨 Render section content
  const renderContent = () => {
    if (activeMenu === "dashboard") {
      return (
        <div>
          <h3 className="mb-3">Dashboard Summary</h3>
          <div className="d-flex flex-wrap gap-3 mb-4">
            {[ 
              { title: "Total Violations", value: total, color: "#007bff" },
              { title: "Red Light", value: red, color: "#dc3545" },
              { title: "Seatbelt", value: seatbelt, color: "#ffc107" },
              { title: "Overspeeding", value: overspeed, color: "#28a745" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex-fill p-3 text-white rounded shadow-sm"
                style={{ backgroundColor: stat.color, minWidth: 180 }}
              >
                <h6>{stat.title}</h6>
                <h3>{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h4>Recent 5 Violations</h4>
            {recentViolations.length === 0 ? (
              <p className="text-muted mt-3">No recent violations found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Vehicle No</th>
                      <th>Type</th>
                      <th>Time</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentViolations.map((v, i) => (
                      <tr key={v._id || i}>
                        <td>{i + 1}</td>
                        <td>{v.vehicle_no}</td>
                        <td className="text-capitalize">{v.type}</td>
                        <td>{new Date(v.timestamp).toLocaleString()}</td>
                        <td>
                          <img
                            src={v.image_url || "https://via.placeholder.com/80"}
                            alt="proof"
                            width="80"
                            className="rounded border"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeMenu === "violations") {
      return (
        <div>
          <h3>All Violations in Your Location</h3>
          {violationsLoading ? (
            <p>Loading violations...</p>
          ) : violations.length === 0 ? (
            <p>No violations found for your location.</p>
          ) : (
            <>
              <table className="table table-striped table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Vehicle No</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((v, i) => (
                    <tr key={v._id || i}>
                      <td>{indexOfFirstItem + i + 1}</td>
                      <td>{v.vehicle_no}</td>
                      <td className="text-capitalize">{v.type}</td>
                      <td>{new Date(v.timestamp).toLocaleString()}</td>
                      <td>{v.location}</td>
                      <td>
                        <img
                          src={v.image_url || "https://via.placeholder.com/80"}
                          alt="proof"
                          width="80"
                          className="rounded border"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      );
    }

    if (activeMenu === "capture") {
      return (
        <div className="text-center mt-5">
          <h3>📸 Capture Violation</h3>
          <p className="text-muted">This feature is coming soon...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="d-flex vh-100 main-content">
      {/* Sidebar */}
      <aside
        className="d-flex flex-column p-3 position-fixed top-0 bottom-0 sidebar"
        style={{ width: 250 }}
      >
        <div className="text-center mb-4">
          <img
            src={officerImage}
            alt="Officer"
            className="rounded-circle mb-2 border border-secondary"
            width="80"
            height="80"
          />
          <h5 className="fw-bold text-white">
            {loadingOfficer ? "Loading..." : officerName}
          </h5>
        </div>

        <ul className="nav flex-column flex-grow-1">
          {[
            ["dashboard", "Dashboard", <FaTachometerAlt className="me-2" />],
            ["violations", "Violations", <FaCarCrash className="me-2" />],
            ["reports", "Reports", <FaFileAlt className="me-2" />],
            ["capture", "Capture", <FaCamera className="me-2" />],
          ].map(([key, label, icon]) => (
            <li className="nav-item mb-2" key={key}>
              <button
                onClick={() => setActiveMenu(key)}
                className={`nav-link btn btn-link text-start text-white sidebar-btn ${
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
              className="nav-link btn btn-link text-start text-danger sidebar-btn"
            >
              <FaSignOutAlt className="me-2" /> Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: 250 }}>
        <nav className="navbar navbar-light bg-white shadow-sm px-3">
          <span className="navbar-brand mb-0 h5">
            👮 Welcome, {loadingOfficer ? "Loading..." : officerName}
          </span>
        </nav>
        <div className="flex-grow-1 overflow-auto p-4">{renderContent()}</div>
      </div>

      {/* Styles */}
      <style>{`
        .sidebar {
          background: linear-gradient(180deg, #212529 0%, #343a40 100%);
          color: #fff;
          box-shadow: 2px 0 10px rgba(0,0,0,0.2);
        }
        .sidebar-btn {
          width: 100%;
          font-size: 15px;
          padding: 10px 15px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        .sidebar-btn:hover {
          background-color: #495057;
          transform: translateX(3px);
        }
        .sidebar-btn.active {
          background-color: #0d6efd;
        }
        .restricted-message {
          display: flex;
          flex-direction: column;
          height: 100vh;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 24px;
          color: #fff;
          background: linear-gradient(135deg, #2ecc71, #f1c40f, #e74c3c);
        }
      `}</style>
    </div>
  );
}
