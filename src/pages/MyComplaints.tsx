import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyComplaints.css";

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

function MyComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          throw new Error("Failed to load complaints");
        }

        const data = await response.json();

        setComplaints(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchComplaints();
  }, []);

  return (
    <div className="complaints-page">

      <header className="complaints-navbar">

        <div
          className="complaints-brand"
          onClick={() => navigate("/dashboard")}
        >
          <span className="brand-mark"></span>
          CivicPulse
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

      </header>

      <main className="complaints-container">

        <div className="complaints-header">

          <div>
            <p className="eyebrow">CITIZEN DASHBOARD</p>

            <h1>My complaints</h1>

            <p>
              Track the issues you have reported.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/complaints/new")}
          >
            Report an Issue
          </button>

        </div>

        {loading && (
          <p className="muted">Loading complaints...</p>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="empty-state">
            <h2>No complaints yet</h2>

            <p>
              You haven't reported any civic issues.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate("/complaints/new")}
            >
              Report your first issue
            </button>
          </div>
        )}

        <div className="complaint-list">

          {complaints.map((complaint) => (

            <div
              className="complaint-card"
              key={complaint.id}
              onClick={() =>
                navigate(`/complaints/${complaint.id}`)
              }
            >

              <div className="complaint-main">

                <div className="complaint-title-row">

                  <h2>
                    {complaint.category
                      .replaceAll("_", " ")}
                  </h2>

                  <span
                    className={`status status-${complaint.status}`}
                  >
                    {complaint.status.replaceAll("_", " ")}
                  </span>

                </div>

                <p className="complaint-text">
                  {complaint.text}
                </p>

                <div className="complaint-meta">

                  <span>
                    {complaint.department}
                  </span>

                  <span>
                    Priority {complaint.priority_score}
                  </span>

                  <span>
                    {new Date(
                      complaint.created_at
                    ).toLocaleDateString()}
                  </span>

                </div>

              </div>

              <div className="complaint-arrow">
                →
              </div>

            </div>

          ))}

        </div>

      </main>

    </div>
  );
}

export default MyComplaints;
