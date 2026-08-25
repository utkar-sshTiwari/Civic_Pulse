import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to create account."
        );
      }

      // Registration succeeded.
      // Go to login rather than automatically
      // logging the user in.

      navigate("/login");

    } catch (error) {
      setError(
        (error as Error).message
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">

      {/* BRAND PANEL */}

      <section className="register-brand-panel">

        <div className="register-brand">

          <span className="register-brand-mark"></span>

          <span>CivicPulse</span>

        </div>


        <div className="register-brand-content">

          <p className="register-eyebrow">
            CIVIC SERVICES PLATFORM
          </p>

          <h1>
            Make your
            <br />
            community
            <br />
            better.
          </h1>

          <p>
            Create an account to report civic
            issues and track their progress.
          </p>

        </div>


        <div className="register-brand-footer">
          AI-powered civic complaint management
        </div>

      </section>


      {/* REGISTER PANEL */}

      <main className="register-panel">

        <div className="register-card">

          <div className="register-header">

            <p className="register-mobile-brand">
              CivicPulse
            </p>

            <h2>
              Create an account
            </h2>

            <p>
              Register to start reporting civic
              issues.
            </p>

          </div>


          <form
            className="register-form"
            onSubmit={handleRegister}
          >

            {/* USERNAME */}

            <div className="register-field">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Choose a username"
                autoComplete="username"
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="register-field">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="register-field">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
              />

            </div>


            {/* ERROR */}

            {error && (
              <div className="register-error">
                {error}
              </div>
            )}


            {/* SUBMIT */}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>

          </form>


          {/* LOGIN */}

          <div className="register-login">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
            >
              Sign in
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Register;
