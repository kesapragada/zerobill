// FILE: frontend/src/pages/ForgotPassword.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import api from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formInputStyles = "form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400";

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-left space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
        <p className="text-gray-600">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback Messages */}
        {message && <p className="text-sm text-center bg-blue-100 border border-blue-200 text-blue-700 p-3 rounded-md">{message}</p>}
        {error && <p className="text-sm text-center bg-red-100 border border-red-200 text-red-600 p-3 rounded-md">{error}</p>}

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
            placeholder="Enter your email"
            className={formInputStyles}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading || !!message} className="w-full justify-center !py-2.5 bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      {/* Link back to Login */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;