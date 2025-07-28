// zerobill/frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial page load auth check

  useEffect(() => {
    // On component mount, check if a valid session cookie exists by calling the /me endpoint.
    const checkLoggedIn = async () => {
      try {
        const response = await api.get("/user/me");
        setUser(response.data);
      } catch (error) {
        // No valid cookie, or server is down. In any case, there's no user.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // Login function now calls the API and updates state from the response.
  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data); // The backend now returns the user object on successful login.
  };

  // Logout function clears the cookie on the backend and resets local state.
  const logout = async () => {
    try {
        await api.post("/auth/logout");
    } catch (error) {
        console.error("Logout failed, clearing user state anyway.", error);
    } finally {
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);