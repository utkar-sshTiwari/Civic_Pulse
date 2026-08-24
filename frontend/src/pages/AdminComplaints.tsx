import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminComplaints.css";

interface Complaint {
  id: number;
  text: string;
  category: string;
  severity: number;
  urgency: number;
  safety_risk: number;
  public_impact: number;
  priority_score: number;
  department: string;
  status: string;
  created_at: string;
}

function AdminComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadComplaints() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
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
          const data = await response.json();

          throw new Error(
            data.detail ||
            "Failed to load complaints"
          );
        }

        const data = await response.json();

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

    loadComplaints();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading complaints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">

      <header className="admin-navbar">

        <div className="admin-brand">
          <span className="brand-mark"></span>
          CivicPulse
        </div>

        <nav>

          <button
            onClick={() =>
              navigate("/admin")
            }
          >
            Overview
          </button>

          <button
            className="active"
          >
            Complaints
          </button>

        </nav>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>

      </header>


      <main className="admin-container">

        <div className="admin-header">

          <div>
            <p className="eyebrow">
              AUTHORITY
            </p>

            <h1>Complaints</h1>

            <p>
              Review and prioritize reported
              civic issues.
            </p>
          </div>

        </div>


        <section className="complaint-table">

          <div className="table-header">

            <span>ID</span>
            <span>Issue</span>
            <span>Department</span>
            <span>Priority</span>
            <span>Status</span>

          </div>


          {complaints.map((complaint) => (

            <div
              className="table-row"
              key={complaint.id}
              onClick={() =>
                navigate(
                  `/admin/complaints/${complaint.id}`
                )
              }
            >

              <span>
                #{complaint.id}
              </span>

              <div>
                <strong>
                  {complaint.category
                    .replaceAll("_", " ")}
                </strong>

                <p>
                  {complaint.text}
                </p>
              </div>

              <span>
                {complaint.department}
              </span>

              <strong>
                {complaint.priority_score}
              </strong>

              <span>
                {complaint.status
                  .replaceAll("_", " ")}
              </span>

            </div>

          ))}

        </section>

      </main>

    </div>
  );
}

export default AdminComplaints;
