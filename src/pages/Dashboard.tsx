import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./Dashboard.css";

import ComplaintHeatmap from "../components/ComplaintHeatmap";


interface DashboardStatistics {
  total_complaints: number;
  pending: number;
  assigned: number;
  in_progress: number;
  resolved: number;
}


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


function Dashboard() {

  const navigate = useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [stats, setStats] =
    useState<DashboardStatistics | null>(null);

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [error, setError] =
    useState("");

  const [loadingComplaints, setLoadingComplaints] =
    useState(true);


  // =========================================================
  // GET DASHBOARD STATISTICS
  // =========================================================

  useEffect(() => {

    async function getStatistics() {

      const token =
        localStorage.getItem("token");

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

          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          throw new Error(
            "Failed to load dashboard"
          );
        }


        const data =
          await response.json();


        setStats(data);

      } catch (error) {

        setError(
          (error as Error).message
        );

      }

    }


    getStatistics();

  }, [navigate]);


  // =========================================================
  // GET COMPLAINTS FOR HEATMAP
  // =========================================================

  useEffect(() => {

    async function getComplaints() {

      const token =
        localStorage.getItem("token");


      if (!token) {
        setError("You are not logged in.");
        setLoadingComplaints(false);
        return;
      }


      try {

        const response = await fetch(
          "http://127.0.0.1:8000/complaints?limit=100",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        if (!response.ok) {

          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          throw new Error(
            "Failed to load complaints"
          );
        }


        const data =
          await response.json();


        setComplaints(data);

      } catch (error) {

        setError(
          (error as Error).message
        );

      } finally {

        setLoadingComplaints(false);

      }

    }


    getComplaints();

  }, [navigate]);


  // =========================================================
  // LOADING
  // =========================================================

  if (!stats) {

    return (
      <div className="dashboard-page">

        <div className="dashboard-loading">

          Loading dashboard...

        </div>

      </div>
    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (
      <div className="dashboard-page">

        <div className="dashboard-error">

          {error}

        </div>

      </div>
    );

  }


  // =========================================================
  // DASHBOARD
  // =========================================================

  return (

    <div className="dashboard-page">


      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="navbar">


        <div
          className="brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <span className="brand-mark"></span>

          <span>
            CivicPulse
          </span>

        </div>


        <nav>


          <button
            className="nav-link active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>


          <button
            className="nav-link"
            onClick={() =>
              navigate("/complaints")
            }
          >
            My Complaints
          </button>


          <button
            className="nav-link"
            onClick={() =>
              navigate("/complaints/new")
            }
          >
            Report an Issue
          </button>


        </nav>


      </header>



      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="dashboard-container">


        {/* ===================================================
            WELCOME
            =================================================== */}

        <section className="welcome">


          <div>

            <p className="eyebrow">
              CITIZEN DASHBOARD
            </p>


            <h1>
              Civic issues at a glance
            </h1>


            <p className="subtitle">
              Track reported issues and their
              progress through the civic response
              system.
            </p>

          </div>


          <button
            className="primary-button"
            onClick={() =>
              navigate("/complaints/new")
            }
          >
            Report an Issue
          </button>


        </section>



        {/* ===================================================
            STATISTICS
            =================================================== */}

        <section className="statistics">


          <div className="stat-card">

            <span>
              Total complaints
            </span>

            <strong>
              {stats.total_complaints}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending
            </span>

            <strong>
              {stats.pending}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Assigned
            </span>

            <strong>
              {stats.assigned}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Resolved
            </span>

            <strong>
              {stats.resolved}
            </strong>

          </div>


        </section>



        {/* ===================================================
            HEATMAP
            =================================================== */}

        <section className="dashboard-map-section">


          <div className="section-header">

            <div>

              <h2>
                Civic issue intensity
              </h2>

              <p>
                Areas with higher-priority complaints
                appear more intensely on the map.
              </p>

            </div>

          </div>



          <div className="dashboard-map">


            {loadingComplaints ? (

              <div className="map-loading">

                Loading complaint map...

              </div>

            ) : complaints.length === 0 ? (

              <div className="map-empty">

                No complaints available yet.

              </div>

            ) : (

              <MapContainer
                center={[
                  28.6139,
                  77.2090,
                ]}
                zoom={11}
                scrollWheelZoom={true}
                style={{
                  height: "500px",
                  width: "100%",
                }}
              >


                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                <ComplaintHeatmap
                  complaints={complaints}
                />


              </MapContainer>

            )}


          </div>



          {/* HEATMAP LEGEND */}

          <div className="heatmap-legend">

            <span>
              Lower priority
            </span>


            <div className="heatmap-gradient"></div>


            <span>
              Higher priority
            </span>

          </div>


        </section>



        {/* ===================================================
            COMPLAINT OVERVIEW
            =================================================== */}

        <section className="overview">


          <div className="section-header">

            <div>

              <h2>
                Complaint overview
              </h2>

              <p>
                Current status of civic complaints
              </p>

            </div>

          </div>



          <div className="progress-container">


            {/* PENDING */}

            <div className="progress-row">


              <div className="progress-label">

                <span>
                  Pending
                </span>

                <span>
                  {stats.pending}
                </span>

              </div>


              <div className="progress-bar">

                <div
                  className="progress-fill pending"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (
                            stats.pending /
                            stats.total_complaints
                          ) * 100
                        : 0
                    }%`,
                  }}
                />

              </div>


            </div>



            {/* ASSIGNED */}

            <div className="progress-row">


              <div className="progress-label">

                <span>
                  Assigned
                </span>

                <span>
                  {stats.assigned}
                </span>

              </div>


              <div className="progress-bar">

                <div
                  className="progress-fill assigned"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (
                            stats.assigned /
                            stats.total_complaints
                          ) * 100
                        : 0
                    }%`,
                  }}
                />

              </div>


            </div>



            {/* IN PROGRESS */}

            <div className="progress-row">


              <div className="progress-label">

                <span>
                  In progress
                </span>

                <span>
                  {stats.in_progress}
                </span>

              </div>


              <div className="progress-bar">

                <div
                  className="progress-fill progress"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (
                            stats.in_progress /
                            stats.total_complaints
                          ) * 100
                        : 0
                    }%`,
                  }}
                />

              </div>


            </div>



            {/* RESOLVED */}

            <div className="progress-row">


              <div className="progress-label">

                <span>
                  Resolved
                </span>

                <span>
                  {stats.resolved}
                </span>

              </div>


              <div className="progress-bar">

                <div
                  className="progress-fill resolved"
                  style={{
                    width: `${
                      stats.total_complaints
                        ? (
                            stats.resolved /
                            stats.total_complaints
                          ) * 100
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
