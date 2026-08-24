import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

interface Complaint {
  id: number;
  text: string;
  category: string;
  priority_score: number;
  department: string;
  status: string;
  created_at: string;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [departmentFilter, setDepartmentFilter] =
    useState("all");


  // =========================
  // FETCH COMPLAINTS
  // =========================

  useEffect(() => {
    async function fetchComplaints() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/complaints",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          let message =
            "Failed to load complaints";

          try {
            const data =
              await response.json();

            if (data.detail) {
              message = data.detail;
            }
          } catch {
            // Ignore JSON parsing errors
          }

          throw new Error(message);
        }

        const data: Complaint[] =
          await response.json();

        // Highest priority first
        const sorted = [...data].sort(
          (a, b) =>
            b.priority_score -
            a.priority_score
        );

        setComplaints(sorted);

      } catch (error) {
        setError(
          (error as Error).message
        );

      } finally {
        setLoading(false);
      }
    }

    fetchComplaints();
  }, []);


  // =========================
  // GET DEPARTMENTS
  // =========================

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        complaints
          .map(
            (complaint) =>
              complaint.department
          )
          .filter(Boolean)
      )
    ).sort();
  }, [complaints]);


  // =========================
  // FILTER COMPLAINTS
  // =========================

  const filteredComplaints =
    useMemo(() => {
      return complaints.filter(
        (complaint) => {

          const matchesStatus =
            statusFilter === "all" ||
            complaint.status ===
              statusFilter;

          const matchesDepartment =
            departmentFilter === "all" ||
            complaint.department ===
              departmentFilter;

          return (
            matchesStatus &&
            matchesDepartment
          );
        }
      );
    }, [
      complaints,
      statusFilter,
      departmentFilter,
    ]);


  // =========================
  // STATISTICS
  // =========================

  const pendingCount =
    complaints.filter(
      (complaint) =>
        complaint.status === "pending"
    ).length;

  const assignedCount =
    complaints.filter(
      (complaint) =>
        complaint.status === "assigned"
    ).length;

  const inProgressCount =
    complaints.filter(
      (complaint) =>
        complaint.status === "in_progress"
    ).length;

  const resolvedCount =
    complaints.filter(
      (complaint) =>
        complaint.status === "resolved"
    ).length;


  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-message">
          Loading authority dashboard...
        </div>
      </div>
    );
  }


  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-message">

          <div className="admin-error">
            {error}
          </div>

        </div>
      </div>
    );
  }


  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="admin-page">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="admin-navbar">

        {/* BRAND */}

        <div
          className="admin-brand"
          onClick={() =>
            navigate("/admin")
          }
        >
          <span className="brand-mark"></span>

          CivicPulse
        </div>


        {/* NAVIGATION */}

        <nav className="admin-nav">

          <button
            className="admin-nav-link active"
            onClick={() =>
              navigate("/admin")
            }
          >
            Overview
          </button>

          <button
            className="admin-nav-link"
            onClick={() =>
              navigate("/admin/complaints")
            }
          >
            Complaints
          </button>

        </nav>


        {/* LOGOUT */}

        <button
          className="admin-logout"
          onClick={() => {

            localStorage.removeItem(
              "token"
            );

            navigate("/login");

          }}
        >
          Logout
        </button>

      </header>


      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="admin-container">

        {/* HEADER */}

        <section className="admin-header">

          <div>

            <p className="admin-eyebrow">
              AUTHORITY DASHBOARD
            </p>

            <h1>
              Priority queue
            </h1>

            <p>
              Review civic complaints ranked
              by AI-generated priority.
            </p>

          </div>

        </section>


        {/* =========================
            STATISTICS
        ========================= */}

        <section className="admin-statistics">

          <div className="admin-stat-card">
            <span>
              Total complaints
            </span>

            <strong>
              {complaints.length}
            </strong>
          </div>


          <div className="admin-stat-card">
            <span>
              Pending
            </span>

            <strong>
              {pendingCount}
            </strong>
          </div>


          <div className="admin-stat-card">
            <span>
              Assigned
            </span>

            <strong>
              {assignedCount}
            </strong>
          </div>


          <div className="admin-stat-card">
            <span>
              In progress
            </span>

            <strong>
              {inProgressCount}
            </strong>
          </div>


          <div className="admin-stat-card">
            <span>
              Resolved
            </span>

            <strong>
              {resolvedCount}
            </strong>
          </div>

        </section>


        {/* =========================
            PRIORITY QUEUE
        ========================= */}

        <section className="admin-queue">

          {/* QUEUE HEADER */}

          <div className="admin-queue-header">

            <div>

              <h2>
                Priority queue
              </h2>

              <p>
                Highest-priority complaints
                appear first.
              </p>

            </div>


            {/* FILTERS */}

            <div className="admin-filters">

              {/* STATUS FILTER */}

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="admin-filter"
              >

                <option value="all">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="assigned">
                  Assigned
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

              </select>


              {/* DEPARTMENT FILTER */}

              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(
                    event.target.value
                  )
                }
                className="admin-filter"
              >

                <option value="all">
                  All departments
                </option>

                {departments.map(
                  (department) => (

                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>


          {/* =========================
              COMPLAINT LIST
          ========================= */}

          {filteredComplaints.length === 0 ? (

            <div className="admin-empty">
              No complaints match the
              selected filters.
            </div>

          ) : (

            filteredComplaints.map(
              (complaint) => (

                <div
                  key={complaint.id}

                  className="admin-complaint-row"

                  /*
                   * IMPORTANT:
                   * Admin complaints MUST go to
                   * the admin detail page.
                   */
                  onClick={() =>
                    navigate(
                      `/admin/complaints/${complaint.id}`
                    )
                  }

                  role="button"
                  tabIndex={0}

                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      navigate(
                        `/admin/complaints/${complaint.id}`
                      );
                    }
                  }}
                >

                  {/* PRIORITY */}

                  <div className="admin-priority">

                    <span className="admin-priority-label">
                      Priority
                    </span>

                    <span className="admin-priority-value">

                      {complaint.priority_score.toFixed(
                        1
                      )}

                    </span>

                  </div>


                  {/* COMPLAINT INFO */}

                  <div className="admin-complaint-info">

                    <h3 className="admin-complaint-title">

                      {complaint.category
                        .replaceAll(
                          "_",
                          " "
                        )}

                    </h3>

                    <p className="admin-complaint-description">

                      {complaint.text}

                    </p>

                    <span className="admin-complaint-department">

                      {complaint.department}

                    </span>

                  </div>


                  {/* STATUS */}

                  <span
                    className={`admin-status admin-status-${complaint.status}`}
                  >

                    {complaint.status
                      .replaceAll(
                        "_",
                        " "
                      )}

                  </span>


                  {/* DATE */}

                  <span className="admin-date">

                    {new Date(
                      complaint.created_at
                    ).toLocaleDateString()}

                  </span>


                  {/* ARROW */}

                  <div className="admin-complaint-arrow">
                    →
                  </div>

                </div>

              )
            )
          )}

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;
