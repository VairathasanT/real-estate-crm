import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("sales@estateflow.com");
  const [password, setPassword] = useState("Sales@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-logo"><Building2 size={21} /></div>
          <div>
            <strong>EstateFlow</strong>
            <span>Real Estate CRM</span>
          </div>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your EstateFlow CRM account.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <label className="remember-row">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="login-help">Need help signing in? Contact your administrator.</p>
        </form>
      </div>
      <p className="login-disclaimer">EstateFlow CRM — Secure sales &amp; property management workspace</p>
    </div>
  );
}