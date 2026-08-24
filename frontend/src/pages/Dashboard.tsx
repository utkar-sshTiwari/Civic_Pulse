import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface DashboardStatistics {
  total_complaints: number;
  pending: number;
  assigned: number;
  in_progress: number;
  resolved: number;
}

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState<DashboardStatistics | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    async function getStatistics() {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/dashboard/statistics",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }

        const data = await response.json();

        setStats(data);
      } catch (error) {
        setError((error as Error).message);
      }
    }

    getStatistics();
  }, []);

  if (error) {
    return (
      <div className="dashboard-page">
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}

      <header className="navbar">

        <div className="brand">
          <span className="brand-mark"></span>
          <span>CivicPulse</span>
        </div>

        <nav>
          <button className="nav-link active">
            Dashboard
          </button>

	  <button
 	    className="nav-link"
  	    onClick={() => navigate("/complaints")}
	    >
  	   My Complaints
	  </button>

          <button
            className="nav-link"
            onClick={() => navigate("/complaints/new")}
          >
            Report an Issue
          </button>
        </nav>

      </header>


      {/* MAIN CONTENT */}

      <main className="dashboard-container">

        <section className="welcome">

          <div>
            <p className="eyebrow">
              CITIZEN DASHBOARD
            </p>

            <h1>
              Civic issues at a glance
            </h1>

            <p className="subtitle">
              Track reported issues and their progress
              through the civic response system.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/complaints/new")}
          >
            Report an Issue
          </button>

        </section>


        {/* STATISTICS */}

        <section className="statistics">

          <div className="stat-card">
            <span>Total complaints</span>
            <strong>{stats.total_complaints}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>

          <div className="stat-card">
            <span>Assigned</span>
            <strong>{stats.assigned}</strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>

        </section>


        {/* OVERVIEW */}

        <section className="overview">

          <div className="section-header">

            <div>
              <h2>Complaint overview</h2>

              <p>
                Current status of civic complaints
              </p>
            </div>

          </div>


          <div className="progress-container">

            <div className="progress-row">

              <div className="progress-label">
                <span>Pending</span>
                <span>{stats.pending}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill pending"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (stats.pending /
                            stats.total_complaints) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>


            <div className="progress-row">

              <div className="progress-label">
                <span>Assigned</span>
                <span>{stats.assigned}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill assigned"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (stats.assigned /
                            stats.total_complaints) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>


            <div className="progress-row">

              <div className="progress-label">
                <span>In progress</span>
                <span>{stats.in_progress}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill progress"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (stats.in_progress /
                            stats.total_complaints) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>


            <div className="progress-row">

              <div className="progress-label">
                <span>Resolved</span>
                <span>{stats.resolved}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill resolved"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (stats.resolved /
                            stats.total_complaints) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
