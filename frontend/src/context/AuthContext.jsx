// zerobill/frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On initial app load, this effect runs ONCE to check
  // if there's a valid session cookie on the backend.
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await api.get("/user/me");
        setUser(response.data); // If successful, we have a user.
      } catch (error) {
        setUser(null); // If it fails (e.g., 401), there is no user.
      } finally {
        setIsLoading(false); // Stop the loading indicator.
      }
    };
    checkUserStatus();
  }, []);

  // Login function now calls the API and expects the user object back.
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      setUser(response.data); // Update the global user state.
    } catch (error) {
      throw error; // Let the Login page handle the error display.
    }
  };

  // Logout function clears the cookie on the backend and resets the local user state.
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed on server, clearing client state regardless.", error);
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