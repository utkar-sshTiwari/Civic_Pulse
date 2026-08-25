import "./AdminComplaintDetail.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Complaint {
  id: number;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: number;
  urgency: number;
  safety_risk: number;
  public_impact: number;
  priority_score: number;
  department: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const departments = [
  "Public Works",
  "Water Department",
  "Electricity",
  "Sanitation",
  "Traffic Police",
];

const statuses = [
  "pending",
  "assigned",
  "in_progress",
  "resolved",
];

function AdminComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] =
    useState<Complaint | null>(null);

  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [updatingDepartment, setUpdatingDepartment] =
    useState(false);

  const [success, setSuccess] = useState("");


  // =========================
  // FETCH COMPLAINT
  // =========================

  useEffect(() => {
    async function fetchComplaint() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/complaints/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            data.detail || "Failed to load complaint"
          );
        }

        const data: Complaint =
          await response.json();

        setComplaint(data);
        setStatus(data.status);
        setDepartment(data.department);

      } catch (error) {
        setError(
          (error as Error).message
        );
      } finally {
        setLoading(false);
      }
    }

    fetchComplaint();
  }, [id, navigate]);


  // =========================
  // UPDATE STATUS
  // =========================

  async function updateStatus() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setUpdatingStatus(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/complaints/${id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update status"
        );
      }

      setComplaint(data);
      setStatus(data.status);

      setSuccess(
        "Complaint status updated successfully."
      );

    } catch (error) {
      setError(
        (error as Error).message
      );
    } finally {
      setUpdatingStatus(false);
    }
  }


  // =========================
  // UPDATE DEPARTMENT
  // =========================

  async function updateDepartment() {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setUpdatingDepartment(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/complaints/${id}/department`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            department: department,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update department"
        );
      }

      setComplaint(data);
      setDepartment(data.department);

      setSuccess(
        "Complaint department updated successfully."
      );

    } catch (error) {
      setError(
        (error as Error).message
      );
    } finally {
      setUpdatingDepartment(false);
    }
  }


  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-message">
          Loading complaint...
        </div>
      </div>
    );
  }


  // =========================
  // ERROR
  // =========================

  if (error && !complaint) {
    return (
      <div className="admin-page">
        <div className="admin-message">
          <div className="admin-error">
            {error}
          </div>

          <button
            onClick={() =>
              navigate("/admin/complaints")
            }
          >
            Back to complaints
          </button>
        </div>
      </div>
    );
  }


  if (!complaint) {
    return null;
  }


  // =========================
  // PAGE
  // =========================

  return (
    <div className="admin-page">

      {/* NAVBAR */}

      <header className="admin-navbar">

        <div
          className="admin-brand"
          onClick={() =>
            navigate("/admin")
          }
        >
          <span className="brand-mark"></span>
          CivicPulse
        </div>

        <nav className="admin-nav">

          <button
            className="admin-nav-link"
            onClick={() =>
              navigate("/admin")
            }
          >
            Overview
          </button>

          <button
            className="admin-nav-link active"
            onClick={() =>
              navigate("/admin/complaints")
            }
          >
            Complaints
          </button>

        </nav>

        <button
          className="admin-logout"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>

      </header>


      {/* CONTENT */}

      <main className="admin-container">

        {/* BACK */}

        <button
          className="admin-back-button"
          onClick={() =>
            navigate("/admin/complaints")
          }
        >
          ← Back to complaints
        </button>


        {/* HEADER */}

        <section className="admin-header">

          <div>

            <p className="admin-eyebrow">
              COMPLAINT #{complaint.id}
            </p>

            <h1>
              {complaint.category.replaceAll(
                "_",
                " "
              )}
            </h1>

            <p>
              Review and manage this civic complaint.
            </p>

          </div>

        </section>


        {/* COMPLAINT */}

        <section className="admin-detail-card">

          <div className="admin-detail-section">

            <span className="admin-detail-label">
              Description
            </span>

            <p className="admin-detail-text">
              {complaint.text}
            </p>

          </div>


          {/* PRIORITY */}

          <div className="admin-detail-grid">

            <div>
              <span className="admin-detail-label">
                Priority
              </span>

              <strong>
                {complaint.priority_score.toFixed(1)}
              </strong>
            </div>

            <div>
              <span className="admin-detail-label">
                Severity
              </span>

              <strong>
                {complaint.severity}
              </strong>
            </div>

            <div>
              <span className="admin-detail-label">
                Urgency
              </span>

              <strong>
                {complaint.urgency}
              </strong>
            </div>

            <div>
              <span className="admin-detail-label">
                Safety risk
              </span>

              <strong>
                {complaint.safety_risk}
              </strong>
            </div>

            <div>
              <span className="admin-detail-label">
                Public impact
              </span>

              <strong>
                {complaint.public_impact}
              </strong>
            </div>

          </div>

        </section>


        {/* MANAGEMENT */}

        <section className="admin-management-card">

          <div className="admin-management-header">

            <div>

              <h2>
                Complaint management
              </h2>

              <p>
                Update the department and current
                workflow status.
              </p>

            </div>

          </div>


          {/* DEPARTMENT */}

          <div className="admin-control">

            <label>
              Department
            </label>

            <div className="admin-control-row">

              <select
                value={department}
                onChange={(event) =>
                  setDepartment(
                    event.target.value
                  )
                }
                className="admin-control-select"
              >

                {departments.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}

              </select>

              <button
                className="admin-update-button"
                onClick={updateDepartment}
                disabled={updatingDepartment}
              >
                {updatingDepartment
                  ? "Updating..."
                  : "Update department"}
              </button>

            </div>

          </div>


          {/* STATUS */}

          <div className="admin-control">

            <label>
              Status
            </label>

            <div className="admin-control-row">

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="admin-control-select"
              >

                {statuses.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item.replaceAll(
                        "_",
                        " "
                      )}
                    </option>
                  )
                )}

              </select>

              <button
                className="admin-update-button"
                onClick={updateStatus}
                disabled={updatingStatus}
              >
                {updatingStatus
                  ? "Updating..."
                  : "Update status"}
              </button>

            </div>

          </div>


          {/* MESSAGES */}

          {success && (
            <div className="admin-success">
              {success}
            </div>
          )}

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

        </section>


        {/* LOCATION */}

        <section className="admin-detail-card">

          <div className="admin-detail-section">

            <span className="admin-detail-label">
              Reported location
            </span>

            <p>
              Latitude: {complaint.latitude}
              <br />
              Longitude: {complaint.longitude}
            </p>

          </div>

          <div className="admin-detail-section">

            <span className="admin-detail-label">
              Reported
            </span>

            <p>
              {new Date(
                complaint.created_at
              ).toLocaleString()}
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminComplaintDetail;
