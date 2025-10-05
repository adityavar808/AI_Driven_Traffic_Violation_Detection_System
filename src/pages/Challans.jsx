import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Challans() {
  const [challans, setChallans] = useState([]);

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/challans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChallans(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChallans();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Challans</h1>
        <table className="table is-fullwidth is-striped">
          <thead>
            <tr>
              <th>Violation ID</th>
              <th>Vehicle No</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issue Date</th>
            </tr>
          </thead>
          <tbody>
            {challans.map(c => (
              <tr key={c._id}>
                <td>{c.violation_id}</td>
                <td>{c.vehicle_no}</td>
                <td>{c.amount}</td>
                <td>{c.status}</td>
                <td>{new Date(c.issue_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
