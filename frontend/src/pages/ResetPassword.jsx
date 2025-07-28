// zerobill/frontend/src/pages/ResetPassword.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import './AuthForm.css'; // Import shared auth form styles

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. No token provided.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!token) {
        setError("Invalid reset link. Please use the link from your email.");
        setLoading(false);
        return;
    }

    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      
      setSuccess("Password reset successfully! Redirecting to login in 3 seconds...");
      
      setTimeout(() => navigate("/login"), 3000); 

    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="password">New Password (min 6 characters)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="auth-button" disabled={loading || !!success}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;