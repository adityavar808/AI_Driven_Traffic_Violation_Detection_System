import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchViolations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        console.log("JWT Token:", token);

        const res = await axios.get("/violations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response from backend:", res);
        console.log("Response data:", res.data);

        if (res.data.items && Array.isArray(res.data.items)) {
          setViolations(res.data.items);
        } else if (Array.isArray(res.data)) {
          setViolations(res.data);
        } else {
          console.warn("Unexpected response format:", res.data);
          setViolations([]);
        }
      } catch (err) {
        console.error("Error fetching violations:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch violations");
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  if (loading) return <p>Loading violations...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Violations</h1>
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Type</th>
              <th>Timestamp</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {violations.length > 0 ? (
              violations.map((v) => (
                <tr key={v._id}>
                  <td>{v.vehicle_no}</td>
                  <td>{v.type}</td>
                  <td>{new Date(v.timestamp).toLocaleString()}</td>
                  <td>
                    {v.image_url ? (
                      <img src={v.image_url} alt="violation" width={80} />
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No violations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}