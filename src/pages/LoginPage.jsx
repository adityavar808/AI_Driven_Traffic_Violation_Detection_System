import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import officerImage from "../assets/officer.jpg";

export default function TrafficLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      const { token, role, name } = res.data;

      // store token & role
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);

      // redirect by role
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      <style>{`
      html, body {
        height: 100%;
        overflow: hidden;
      }
    `}</style>
      <div className="main-content">
        <div className="container-fluid d-flex align-items-center justify-content-center vh-100">
          <div className="row">
            {/* Left Section */}
            <div
              className="col-md-6 left-section d-flex align-items-center justify-content-center text-white"
              style={{
                background: `url(${officerImage}) center/cover no-repeat`,
                position: "relative",
                minHeight: "400px",
              }}
            >
              <div className="overlay"></div>
              <h1 className="fw-bold display-5 text-center">TRAFFIC DASHBOARD</h1>
            </div>

            {/* Right Section */}
            <div className="col-md-6 right-section d-flex align-items-center justify-content-center p-5">
              <form className="login-form text-center" onSubmit={handleLogin}>
                <h2 className="fw-bold mb-4 text-white">Welcome Back</h2>

                {error && (
                  <p className="text-danger bg-light rounded p-2 small">{error}</p>
                )}

                <div className="mb-3 position-relative">
                  <span className="input-group-text position-absolute top-50 translate-middle-y start-0 ms-2 border-0 bg-transparent text-white">
                    <i className="bi bi-person-fill" style={{ color: "black" }}></i>
                  </span>
                  <input
                    type="email"
                    className="form-control ps-5"
                    placeholder="Officer/Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3 position-relative">
                  <span className="input-group-text position-absolute top-50 translate-middle-y start-0 ms-2 border-0 bg-transparent text-white">
                    <i className="bi bi-lock-fill" style={{ color: "black" }}></i>
                  </span>
                  <input
                    type="password"
                    className="form-control ps-5"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="traffic-btn">
                  <span className="light green"></span>
                  <span className="light yellow"></span>
                  <span className="light red"></span>
                  LOGIN
                  <span className="light green"></span>
                  <span className="light yellow"></span>
                  <span className="light red"></span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="restricted-message text-center d-flex flex-column align-items-center justify-content-center vh-100 px-3">
        <i className="bi bi-exclamation-triangle-fill fs-1 mb-3 text-white"></i>
        <p className="text-white fs-4">
          Sorry, this site is only available on desktop screens. Please use a larger
          device to access the dashboard.
        </p>
      </div> */}
    </div>
  );
}
