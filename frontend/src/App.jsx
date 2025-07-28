// zerobill/frontend/src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
// This import is correct. Vite will automatically look for .js, .jsx, etc.
import { AuthProvider } from "./context/AuthContext"; 

// Page Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ConfigureAWS from "./pages/ConfigureAWS";

// Component Imports
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/configure-aws" element={<ConfigureAWS />} />
          {/* Add other protected routes here */}
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;