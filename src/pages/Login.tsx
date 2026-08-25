import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username,
            password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Invalid username or password"
        );
      }

      const data = await response.json();

      const token = data.access_token;

      localStorage.setItem("token", token);

      // Read role from JWT
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      if (payload.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      setError(
        (error as Error).message
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* Left branding panel */}

      <section className="login-brand-panel">

        <div className="login-brand">
          <span className="login-brand-mark"></span>

          <span>CivicPulse</span>
        </div>

        <div className="login-brand-content">

          <p className="login-eyebrow">
            CIVIC SERVICES PLATFORM
          </p>

          <h1>
            Better cities
            <br />
            start with
            <br />
            better reporting.
          </h1>

          <p>
            Report civic issues, track their progress,
            and help your community get problems
            resolved faster.
          </p>

        </div>

        <div className="login-brand-footer">
          AI-powered civic complaint management
        </div>

      </section>


      {/* Login panel */}

      <main className="login-panel">

        <div className="login-card">

          <div className="login-header">

            <p className="login-mobile-brand">
              CivicPulse
            </p>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to your account to continue.
            </p>

          </div>


          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* Username */}

            <div className="login-field">

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
                placeholder="Enter your username"
                autoComplete="username"
                required
              />

            </div>


            {/* Password */}

            <div className="login-field">

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
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>


            {/* Error */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* Login button */}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>


          <div className="login-register">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/register")
              }
            >
              Create an account
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Login;
