// FILE: frontend/src/pages/ResetPassword.jsx

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setSuccess(res.data.message);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err)      {
      setError(err.response?.data?.message || "Reset failed. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const formInputStyles = "form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400";

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-left space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-600">Create a new, strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Messages */}
        {success && <p className="text-sm text-center bg-green-100 border border-green-200 text-green-700 p-3 rounded-md">{success}</p>}
        {error && <p className="text-sm text-center bg-red-100 border border-red-200 text-red-600 p-3 rounded-md">{error}</p>}

        {/* New Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
            placeholder="Minimum 6 characters"
            className={formInputStyles}
          />
        </div>

        {/* Confirm New Password Input */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
            placeholder="••••••••"
            className={formInputStyles}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading || !!success} className="w-full justify-center !py-2.5 bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      {/* Link back to Login */}
      {success && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Redirecting to{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign In
            </Link>...
          </p>
      )}
    </div>
  );
};

export default ResetPassword;