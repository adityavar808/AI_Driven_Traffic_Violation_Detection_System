import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaBars, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate
import officerImage from "../assets/officer.jpg";
import axios from "axios";

export default function OfficerDashboard() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);

  const navigate = useNavigate();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => setIsRestricted(window.innerWidth <= 1232);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch violations from backend
  useEffect(() => {
    const fetchViolations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/violations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && Array.isArray(res.data)) {
          setViolations(res.data);
        } else {
          setViolations([]);
        }
      } catch (err) {
        console.error("Error fetching violations:", err.response?.data || err.message);
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  // Count violations by type
  const total = violations.length;
  const red = violations.filter(v => v.type === "redlight").length;
  const seatbelt = violations.filter(v => v.type === "seatbelt").length;
  const overspeed = violations.filter(v => v.type === "overspeed").length;

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Small screen restriction
  if (isRestricted) {
    return (
      <div className="restricted-message">
        <FaExclamationTriangle size={60} />
        <p>
          This dashboard is only available on larger screens.  
          Please use a laptop or desktop for the best experience.
        </p>
        <style>{`
          .restricted-message {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100%;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-family: 'Montserrat', sans-serif;
            font-size: 24px;
            color: #fff;
            background: linear-gradient(135deg, #2ecc71, #f1c40f, #e74c3c);
            padding: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 main-content">
      {/* Sidebar */}
      <aside
        className={`bg-dark text-white d-flex flex-column p-3 position-fixed top-0 bottom-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{ width: 250, transition: "all 0.3s" }}
      >
        <div className="text-center mb-4">
          <img src={officerImage} alt="Officer" className="rounded-circle mb-2 border border-secondary" width="80" height="80"/>
          <h5 className="fw-bold">Traffic Officer</h5>
        </div>
        <ul className="nav flex-column flex-grow-1">
          <li className="nav-item mb-2"><a href="#" className="nav-link text-white">Dashboard</a></li>
          <li className="nav-item mb-2"><a href="#" className="nav-link text-white">Violations</a></li>
          <li className="nav-item mb-2"><a href="#" className="nav-link text-white">Reports</a></li>
          <li className="nav-item mt-auto">
            <button 
              onClick={handleLogout} 
              className="nav-link text-danger btn btn-link text-start p-0"
            >
              Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ marginLeft: sidebarOpen ? 250 : 0, transition: "all 0.3s" }}>
        {/* Navbar */}
        <nav className="navbar navbar-light bg-white shadow-sm px-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary d-md-none me-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FaBars />
            </button>
            <span className="navbar-brand mb-0 h5">Officer Dashboard</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="d-none d-sm-block">👮 Aditya Varshney</span>
            <img src={officerImage} alt="Profile" className="rounded-circle border border-secondary" width="40" height="40"/>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-grow-1 overflow-auto p-4">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center vh-100">
              <h4 className="text-secondary">Loading Dashboard...</h4>
            </div>
          ) : (
            <>
              {/* Stats Section */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                {[{ title: "Total Violations", value: total, color: "#007bff" },
                  { title: "Red Light", value: red, color: "#dc3545" },
                  { title: "Seatbelt", value: seatbelt, color: "#ffc107" },
                  { title: "Overspeeding", value: overspeed, color: "#28a745" }
                ].map((stat, idx) => (
                  <div key={idx} className="flex-fill p-3 text-white rounded shadow-sm" style={{ backgroundColor: stat.color, minWidth: 180 }}>
                    <h6>{stat.title}</h6>
                    <h3>{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Violations Table */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white fw-bold fs-5">Recent Violations</div>
                <div className="card-body p-0 overflow-auto">
                  <table className="table table-striped table-hover align-middle mb-0">
                    <thead className="table-primary sticky-top">
                      <tr>
                        <th>#</th>
                        <th>Vehicle No</th>
                        <th>Type</th>
                        <th>Time</th>
                        <th>Image</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.length > 0 ? violations.slice(0, 5).map((v, i) => (
                        <tr key={v._id}>
                          <td>{i + 1}</td>
                          <td>{v.vehicle_no}</td>
                          <td className="text-capitalize">{v.type}</td>
                          <td>{new Date(v.timestamp).toLocaleString()}</td>
                          <td>
                            <img src={v.image_url || "https://via.placeholder.com/80"} alt="proof" width="80" className="rounded border"/>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">View</button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">No violations found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="d-md-none position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.3)", zIndex: 99 }} onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}
