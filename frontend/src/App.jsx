// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout Imports
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

// Page Imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ConfigureAWS from "./pages/ConfigureAWS";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Public auth routes with a dedicated layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected app routes with the main app layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/configure-aws" element={<ConfigureAWS />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;