import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubmitComplaint from "./pages/SubmitComplaint";
import MyComplaints from "./pages/MyComplaints";
import ComplaintDetail from "./pages/ComplaintDetail";

import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminComplaintDetail from "./pages/AdminComplaintDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/complaints"
          element={<AdminComplaints />}
        />

        <Route
          path="/admin/complaints/:id"
          element={<AdminComplaintDetail />}
        />

        {/* ================= CITIZEN ================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/complaints/new"
          element={<SubmitComplaint />}
        />

        <Route
          path="/complaints"
          element={<MyComplaints />}
        />

        <Route
          path="/complaints/:id"
          element={<ComplaintDetail />}
        />

        {/* ================= FALLBACK ================= */}

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
