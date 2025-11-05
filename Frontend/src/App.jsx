import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Violations from "./pages/Violations";
import Challans from "./pages/Challans";
import ProtectedRoute from "./pages/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Officer Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="officer">
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/violations"
          element={
            <ProtectedRoute requiredRole="officer">
              <Violations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challans"
          element={
            <ProtectedRoute requiredRole="officer">
              <Challans />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized Access Page */}
        <Route
          path="/unauthorized"
          element={<h2 className="text-center mt-5">🚫 Access Denied</h2>}
        />

        {/* Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;