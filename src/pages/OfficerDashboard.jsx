// OfficerDashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaTachometerAlt,
  FaCamera,
  FaFileAlt,
  FaExclamationTriangle,
  FaCarCrash,
  FaSignOutAlt,
  FaPlusCircle,
} from "react-icons/fa";
import officerImage from "../assets/officer.jpg";
import axios from "axios";

// charts
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// exports
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function OfficerDashboard() {
  // core state
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [violations, setViolations] = useState([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [officerName, setOfficerName] = useState("");
  const [loadingOfficer, setLoadingOfficer] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [filterRange, setFilterRange] = useState("all");
  const [challans, setChallans] = useState([]);

  // new violation form
  const [newViolation, setNewViolation] = useState({
    vehicle_no: "",
    type: "overspeed",
    image_url: "",
    location: "",
    amount: 0,
  });

  const itemsPerPage = 8;
  const chartRef = useRef(null);

  // screen check
  useEffect(() => {
    const checkScreenSize = () => setIsRestricted(window.innerWidth <= 1232);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // fetch officer info
  useEffect(() => {
    const fetchOfficerInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOfficerName(res.data.name || "Officer");
      } catch {
        setOfficerName("Officer");
      } finally {
        setLoadingOfficer(false);
      }
    };
    fetchOfficerInfo();
  }, []);

  const fetchChallans = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/officer/challans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChallans(res.data);
  };

  // fetch violations
  const fetchViolations = async () => {
    try {
      setViolationsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("http://localhost:5000/officer/violations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViolations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setViolations([]);
    } finally {
      setViolationsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
    fetchChallans();
  }, []);

  // form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewViolation((prev) => ({ ...prev, [name]: value }));
  };

  const submitViolation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");

      // create violation
      const violationRes = await axios.post(
        "http://localhost:5000/officer/violations",
        {
          vehicle_no: newViolation.vehicle_no,
          type: newViolation.type,
          image_url: newViolation.image_url,
          location: newViolation.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // create challan
      await axios.post(
        "http://localhost:5000/officer/challans",
        {
          violation_id: violationRes.data._id,
          amount: newViolation.amount,
          status: "unpaid",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg("Violation & Challan created successfully!");
      setNewViolation({
        vehicle_no: "",
        type: "overspeed",
        image_url: "",
        location: "",
        amount: 0,
      });

      fetchViolations();
    } catch {
      setSuccessMsg("Failed to create violation.");
    } finally {
      setSubmitting(false);
    }
  };

  // filter logic
  const filteredViolations = useMemo(() => {
    if (!violations || violations.length === 0) return [];
    const now = new Date();
    return violations.filter((v) => {
      const t = new Date(v.timestamp);
      if (filterRange === "today") return t.toDateString() === now.toDateString();
      if (filterRange === "7days") return (now - t) / 86400000 <= 7;
      if (filterRange === "month")
        return (
          t.getMonth() === now.getMonth() &&
          t.getFullYear() === now.getFullYear()
        );
      return true;
    });
  }, [violations, filterRange]);

  // CSV
  const downloadCSV = () => {
    try {
      const rows = filteredViolations.map((v) => ({
        vehicle_no: v.vehicle_no || "",
        type: v.type || "",
        location: v.location || "",
        timestamp: v.timestamp ? new Date(v.timestamp).toLocaleString() : "",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Violations");
      XLSX.writeFile(wb, "traffic_violations.csv");
    } catch {
      alert("CSV export failed.");
    }
  };

  // Excel
  const downloadExcel = () => {
    try {
      const dataForExcel = filteredViolations.map((v) => ({
        vehicle_no: v.vehicle_no || "",
        type: v.type || "",
        location: v.location || "",
        timestamp: v.timestamp ? new Date(v.timestamp).toLocaleString() : "",
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Violations");
      XLSX.writeFile(wb, "traffic_violations.xlsx");
    } catch {
      alert("Excel export failed.");
    }
  };

  // PDF
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const tableColumn = ["Vehicle No", "Type", "Location", "Date"];
      const tableRows = filteredViolations.map((v) => [
        v.vehicle_no || "",
        v.type || "",
        v.location || "",
        v.timestamp ? new Date(v.timestamp).toLocaleString() : "",
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows });
      doc.save("traffic_report.pdf");
    } catch {
      alert("PDF export failed.");
    }
  };

  // stats
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

  // pagination
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
        <p>Please use a laptop or desktop.</p>
      </div>
    );
  }

  // chart 
  const chartData = useMemo(() => {
    const dateMap = {};
    filteredViolations.forEach((v) => {
      const raw = v.timestamp ? new Date(v.timestamp) : new Date();
      const dateKey = raw.toLocaleDateString();
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          overspeed: 0,
          redlight: 0,
          seatbelt: 0,
        };
      }
      if (v.type === "overspeed") dateMap[dateKey].overspeed++;
      if (v.type === "redlight") dateMap[dateKey].redlight++;
      if (v.type === "seatbelt") dateMap[dateKey].seatbelt++;
    });

    return Object.keys(dateMap)
      .map((d) => ({ _raw: new Date(d), ...dateMap[d] }))
      .sort((a, b) => a._raw - b._raw)
      .map((r) => ({
        date: r.date,
        overspeed: r.overspeed,
        redlight: r.redlight,
        seatbelt: r.seatbelt,
      }));
  }, [filteredViolations]);

  const renderContent = () => {
    if (activeMenu === "dashboard") {
      return (
        <div>
          <h3 className="mb-3 text-white">Dashboard Summary</h3>

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

          {/* RECENT 5 VIOLATIONS — RECEIPT REMOVED */}
          <div className="mt-4">
            <h4 className="text-white">Recent 5 Violations</h4>

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
                          width="80"
                          className="rounded border"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // ---------------- ALL VIOLATIONS ----------------
    if (activeMenu === "violations") {
      return (
        <div>
          <h3 className="text-white">All Violations</h3>

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
                      width="80"
                      className="rounded border"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeMenu === "addViolation") {
  return (
    <div className="violation-card mx-auto mt-5 p-4 rounded-4 shadow-lg glassy">
      <h2 className="text-center fw-bold pb-4 text-primary">
        🚔 Manual Violation Entry
      </h2>
      {successMsg && (
        <div className="alert alert-success text-center fw-semibold">
          {successMsg}
        </div>
      )}
      <form onSubmit={submitViolation} className="row g-4 col-md-12">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Vehicle Number</label>
          <input
            type="text"
            name="vehicle_no"
            value={newViolation.vehicle_no}
            onChange={handleInputChange}
            className="form-control custom-input"
            placeholder="e.g. MH12AB1234"
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Violation Type</label>
          <select
            name="type"
            value={newViolation.type}
            onChange={handleInputChange}
            className="form-select custom-input"
          >
            <option value="overspeed">Overspeed</option>
            <option value="redlight">Red Light</option>
            <option value="seatbelt">Seatbelt</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Location</label>
          <input
            type="text"
            name="location"
            value={newViolation.location}
            onChange={handleInputChange}
            className="form-control custom-input"
            placeholder="Enter violation location"
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Challan Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={newViolation.amount}
            onChange={handleInputChange}
            className="form-control custom-input"
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Proof Image URL</label>
          <input
            type="text"
            name="image_url"
            value={newViolation.image_url}
            onChange={handleInputChange}
            className="form-control custom-input"
            placeholder="Paste image URL (optional)"
          />
        </div>

        {newViolation.image_url && (
          <div className="col-12 text-center">
            <img
              src={newViolation.image_url}
              alt="preview"
              className="img-thumbnail preview-img mt-2"
            />
          </div>
        )}

        {/* Button layout fixed here */}
        <div className="col-12 d-flex justify-content-center mt-0 pb-4">
          <button
            type="submit"
            className="btn btn-gradient px-5 py-2 rounded-pill fw-semibold submit-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Create Violation & Challan"}
          </button>
        </div>
      </form>

      <style>{`
        .violation-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          animation: fadeIn 0.8s ease;
        }
        .custom-input {
          border-radius: 10px;
          border: 1.5px solid #ced4da;
          transition: all 0.3s ease;
        }
        .custom-input:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 8px rgba(13,110,253,0.3);
        }
        .btn-gradient {
          background: linear-gradient(90deg, #007bff, #00bfff);
          color: #fff;
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
          min-width: 280px;
          font-size: 1.05rem;
          letter-spacing: 0.5px;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(0,123,255,0.45);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .preview-img {
          max-width: 200px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

    // ---------------- REPORTS ----------------
    if (activeMenu === "reports") {
      return (
        <div className="mt-4">
          <h3 className="text-white text-center mb-3">
            Violation Trends (Overspeed, Red-light, Seatbelt)
          </h3>

          <div
            className="p-4 rounded shadow-lg mx-auto bg-white"
            style={{ maxWidth: "930px" }}
          >
            {/* Filter */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <select
                className="form-select"
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>

              <div>
                <button
                  onClick={downloadCSV}
                  className="btn btn-outline-primary me-2"
                >
                  CSV
                </button>
                <button onClick={downloadExcel} className="btn btn-success me-2">
                  Excel
                </button>
                <button onClick={downloadPDF} className="btn btn-danger">
                  PDF
                </button>
              </div>
            </div>  

            {/* Chart */}
            <LineChart
              width={880}
              height={420}
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="overspeed"
                stroke="#0d6efd"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="redlight"
                stroke="#dc3545"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="seatbelt"
                stroke="#ffc107"
                strokeWidth={3}
              />
            </LineChart>
          </div>
        </div>
      );
    }

    // ---------------- CAPTURE ----------------
    if (activeMenu === "capture") {
      return (
        <div className="text-center mt-5 text-white">
          <h3>Capture Violation</h3>
          <p>This feature is coming soon...</p>
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
            ["addViolation", "Add Violation", <FaPlusCircle className="me-2" />],
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

      {/* Main */}
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
          color: white;
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
