import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // LOGIN LOGIC
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
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Invalid username or password");
    }

    const data = await response.json();

    // Save JWT
    const token = data.access_token;

    localStorage.setItem("token", token);

    // Read role from JWT
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    // Redirect based on role
    if (payload.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

  } catch (error) {
    setError((error as Error).message);
  } finally {
    setLoading(false);
  }
}


  // LOGIN FORM / UI
  return (
    <div>
      <h1>CivicPulse</h1>

      <form onSubmit={handleLogin}>

        <div>
          <label>Username</label>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}

export default Login;
