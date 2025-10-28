// FILE: frontend/src/pages/Register.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../api/axios';
import Button from "../components/ui/Button";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
        return setError("Password must be at least 6 characters long.")
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      navigate("/login", { state: { message: "Account created successfully. Please log in." } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const formInputStyles = "form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400";

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-left space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
        <p className="text-gray-600">Start monitoring your cloud costs today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && <p className="text-sm text-center bg-red-100 border border-red-200 text-red-600 p-3 rounded-md">{error}</p>}

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
            placeholder="you@example.com"
            className={formInputStyles}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
            placeholder="Minimum 6 characters"
            className={formInputStyles}
          />
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
            placeholder="••••••••"
            className={formInputStyles}
          />
        </div>

        {/* Sign Up Button */}
        <Button type="submit" disabled={loading} className="w-full justify-center !py-2.5 bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>

      {/* Link to Login */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;