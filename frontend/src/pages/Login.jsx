// FILE: frontend/src/pages/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // [THE FIX] This variable now defines the styles for light-theme inputs
  const formInputStyles = "form-input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400";

  return (
    // The main container for the form
    <div className="space-y-8">
      
      {/* Heading */}
      <div className="text-left space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
        <p className="text-gray-600">Welcome back! Please enter your details.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && <p className="text-sm text-center text-green-600">{success}</p>}
        {error && <p className="text-sm text-center text-red-600">{error}</p>}
        
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className={formInputStyles} />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" className={formInputStyles} />
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button type="submit" disabled={loading} className="w-full !py-2.5 bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;