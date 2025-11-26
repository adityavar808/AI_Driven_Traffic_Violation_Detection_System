import React, { useState, useEffect } from "react";
import { FaSearch, FaCarCrash } from "react-icons/fa";

const ChallanSearch = () => {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [challanData, setChallanData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeIn 1s ease-in-out; }
      .slide-up { animation: slideUp 0.8s ease-in-out; }
      input:focus { box-shadow: 0 0 10px #ffffff; }
      button:hover { transform: scale(1.05); box-shadow: 0 0 15px #ffffff; }
      img:hover { transform: scale(1.05); transition: transform 0.3s ease; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) {
      setError("Please enter a valid vehicle number.");
      return;
    }
    setLoading(true);
    setError("");
    setChallanData([]);

    try {
      const response = await fetch(
        `http://localhost:5000/challans/check/${vehicleNumber}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.message) {
        setError(data.message);
        return;
      }

      if (Array.isArray(data) && data.length > 0) setChallanData(data);
      else setError("No challan records found.");
    } catch (err) {
      console.error(err);
      setError("Error fetching challan data.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (challan_id, amount) => {
    try {
      const orderRes = await fetch(
        `http://localhost:5000/challans/${challan_id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        }
      );

      const orderData = await orderRes.json();
      if (orderData.error) {
        alert(orderData.error);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        handler: async function (response) {
          await fetch(`http://localhost:5000/challans/${challan_id}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          alert("Payment successful!");
          handleSearch();
        },
        theme: { color: "#3399cc" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert("Payment failed!");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} className="fade-in">
        <h1 style={styles.title}>
          <FaCarCrash /> Challan Tracker
        </h1>
        <p style={styles.subtitle}>
          Enter your vehicle number to check pending challans
        </p>

        <input
          type="text"
          placeholder="e.g. DL8CAF1234"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSearch} style={styles.button}>
          <FaSearch /> Search
        </button>

        {loading && <p style={styles.loading}>Searching...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {challanData.length > 0 && (
          <div style={styles.result} className="slide-up">
            <h2 style={styles.resultTitle}>📋 Challan Details</h2>
            {challanData.map((challan) => (
              <div key={challan.challan_id} style={styles.challanBox}>
                <div style={styles.challanContent}>
                  {/* Left: Vehicle Image */}
                  <div style={styles.imageContainer}>
                    <img
                      src={challan.image_url}
                      alt="Violation Proof"
                      style={styles.image}
                      onError={(e) =>
                        (e.target.src =
                          "https://via.placeholder.com/200x120?text=No+Image")
                      }
                    />
                  </div>

                  {/* Right: Details */}
                  <div style={styles.details}>
                    <p>
                      <strong>Date:</strong> {challan.date}
                    </p>
                    <p>
                      <strong>Offense:</strong> {challan.offense}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₹{challan.amount}
                    </p>
                    <p>
                      <strong>Status:</strong> {challan.status}
                    </p>
                    {challan.status === "unpaid" && (
                      <button
                        style={styles.payButton}
                        onClick={() =>
                          handlePay(challan.challan_id, challan.amount)
                        }
                      >
                        Pay ₹{challan.amount}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    background: "linear-gradient(135deg, #0f0f0f, #1c1c1c)",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Poppins, sans-serif",
    color: "#f5f5f5",
    padding: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "40px",
    width: "90%",
    maxWidth: "700px",
    boxShadow: "0 0 40px rgba(255,255,255,0.05)",
    textAlign: "center",
    border: "1px solid #333",
  },
  title: {
    fontSize: "32px",
    marginBottom: "10px",
    color: "#ffffff",
    letterSpacing: "1px",
  },
  subtitle: { fontSize: "16px", marginBottom: "30px", color: "#aaa" },
  input: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    marginBottom: "20px",
    backgroundColor: "#222",
    color: "#fff",
    outline: "none",
    boxShadow: "inset 0 0 10px #000",
    transition: "box-shadow 0.3s ease",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  loading: { marginTop: "20px", fontStyle: "italic", color: "#f0c000" },
  error: { marginTop: "20px", color: "#ff4d4d" },
  result: { marginTop: "30px", textAlign: "left" },
  resultTitle: { fontSize: "24px", marginBottom: "15px", color: "#ffffff" },
  challanBox: {
    backgroundColor: "#1a1a1a",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    borderLeft: "5px solid #ffffff",
    boxShadow: "0 0 15px rgba(255,255,255,0.1)",
  },
  challanContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "25px",
  },
  imageContainer: {
    flexShrink: 0,
  },
  image: {
    width: "200px",
    height: "120px",
    borderRadius: "12px",
    objectFit: "cover",
    border: "2px solid #fff",
  },
  details: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  payButton: {
    marginTop: "10px",
    padding: "8px 16px",
    backgroundColor: "#00c853",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s ease",
    alignSelf: "flex-start",
  },
};

export default ChallanSearch;
