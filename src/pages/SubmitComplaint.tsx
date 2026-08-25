import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./SubmitComplaint.css";


interface LocationPickerProps {
  onLocationSelect: (
    lat: number,
    lng: number
  ) => void;
}


function LocationPicker({
  onLocationSelect,
}: LocationPickerProps) {

  useMapEvents({
    click(event) {
      onLocationSelect(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}


function SubmitComplaint() {

  const navigate = useNavigate();


  // ============================================================
  // FORM STATE
  // ============================================================

  const [text, setText] = useState("");

  const [latitude, setLatitude] = useState(
    28.6139
  );

  const [longitude, setLongitude] = useState(
    77.2090
  );

  const [image, setImage] =
    useState<File | null>(null);


  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] =
    useState(false);

  const [locating, setLocating] =
    useState(false);

  const [error, setError] =
    useState("");


  // ============================================================
  // MAP LOCATION
  // ============================================================

  function handleMapClick(
    lat: number,
    lng: number
  ) {

    setLatitude(lat);
    setLongitude(lng);
  }


  // ============================================================
  // USER LOCATION
  // ============================================================

  function handleUseLocation() {

    setError("");

    if (!navigator.geolocation) {

      setError(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(

      (position) => {

        setLatitude(
          position.coords.latitude
        );

        setLongitude(
          position.coords.longitude
        );

        setLocating(false);
      },

      (error) => {

        setLocating(false);

        if (error.code === 1) {

          setError(
            "Location permission was denied."
          );

        } else {

          setError(
            "Unable to determine your location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }


  // ============================================================
  // IMAGE SELECTION
  // ============================================================

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const selectedFile =
      event.target.files?.[0] ?? null;

    setImage(selectedFile);
  }


  // ============================================================
  // SUBMIT COMPLAINT
  // ============================================================

  async function handleSubmit(
    event: React.FormEvent
  ) {

    event.preventDefault();

    setError("");
    setLoading(true);


    try {

      // --------------------------------------------------------
      // GET JWT
      // --------------------------------------------------------

      const token =
        localStorage.getItem("token");


      if (!token) {

        throw new Error(
          "You are not logged in."
        );
      }


      // --------------------------------------------------------
      // CREATE MULTIPART FORM
      // --------------------------------------------------------

      const formData =
        new FormData();


      formData.append(
        "text",
        text
      );


      formData.append(
        "latitude",
        latitude.toString()
      );


      formData.append(
        "longitude",
        longitude.toString()
      );


      // --------------------------------------------------------
      // ADD IMAGE IF SELECTED
      // --------------------------------------------------------

      if (image) {

        formData.append(
          "image",
          image
        );
      }


      // --------------------------------------------------------
      // SEND TO BACKEND
      // --------------------------------------------------------

      const response =
        await fetch(
          "http://127.0.0.1:8000/complaints",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );


      // --------------------------------------------------------
      // HANDLE ERROR
      // --------------------------------------------------------

      if (!response.ok) {

        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.detail ||
          "Failed to submit complaint"
        );
      }


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      const data =
        await response.json();


      console.log(
        "Complaint created:",
        data
      );


      // Go to complaint detail page

      navigate(
        `/complaints/${data.id}`
      );


    } catch (error) {

      setError(
        (error as Error).message
      );

    } finally {

      setLoading(false);
    }
  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="submit-page">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <header className="submit-navbar">

        <div
          className="submit-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <span className="brand-mark"></span>

          CivicPulse

        </div>


        <button
          className="back-button"
          onClick={() =>
            navigate(-1)
          }
        >
          Back
        </button>

      </header>



      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="submit-container">


        {/* HEADER */}

        <div className="submit-header">

          <p className="eyebrow">
            CITIZEN SERVICES
          </p>


          <h1>
            Report an issue
          </h1>


          <p>
            Tell us about a civic problem and
            indicate where it was reported.
          </p>

        </div>



        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="submit-form"
          onSubmit={handleSubmit}
        >


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <section className="submit-section">

            <label htmlFor="complaint">
              Description
            </label>


            <textarea
              id="complaint"
              value={text}
              onChange={(event) =>
                setText(
                  event.target.value
                )
              }
              placeholder="Describe the issue..."
              required
              minLength={5}
            />

          </section>



          {/* ==================================================
              IMAGE
          ================================================== */}

          <section className="submit-section">

            <label htmlFor="image">
              Evidence image
            </label>


            <p>
              Add a photo showing the issue,
              if available.
            </p>


            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />


            {image && (

              <p>
                Selected: {image.name}
              </p>

            )}

          </section>



          {/* ==================================================
              LOCATION
          ================================================== */}

          <section className="submit-section">


            <div className="location-header">


              <div>

                <h2>
                  Reported location
                </h2>


                <p>
                  Click on the map to select the
                  location of the issue.
                </p>

              </div>



              <button
                type="button"
                className="location-button"
                onClick={
                  handleUseLocation
                }
                disabled={locating}
              >

                {locating
                  ? "Locating..."
                  : "Use My Location"}

              </button>

            </div>



            {/* ==================================================
                MAP
            ================================================== */}

            <div className="submit-map">

              <MapContainer
                center={[
                  latitude,
                  longitude,
                ]}
                zoom={13}
                scrollWheelZoom={true}
                style={{
                  height: "400px",
                  width: "100%",
                }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                <LocationPicker
                  onLocationSelect={
                    handleMapClick
                  }
                />


                <Marker
                  position={[
                    latitude,
                    longitude,
                  ]}
                >

                  <Popup>
                    Selected complaint location
                  </Popup>

                </Marker>

              </MapContainer>

            </div>



            {/* ==================================================
                COORDINATES
            ================================================== */}

            <div className="coordinates">


              <div>

                <span>
                  Latitude
                </span>


                <strong>
                  {latitude.toFixed(6)}
                </strong>

              </div>



              <div>

                <span>
                  Longitude
                </span>


                <strong>
                  {longitude.toFixed(6)}
                </strong>

              </div>

            </div>

          </section>



          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="submit-error">
              {error}
            </div>

          )}



          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="submit-actions">


            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(-1)
              }
            >
              Cancel
            </button>



            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >

              {loading
                ? "Analyzing..."
                : "Submit Complaint"}

            </button>

          </div>


        </form>

      </main>

    </div>
  );
}


export default SubmitComplaint;
