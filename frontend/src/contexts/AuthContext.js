import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check if token expired
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            setUser(null);
          } else {
            const res = await api.get("/users/profile");
            setUser(res.data);
          }
        } catch {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleRegister = async (name, email, password) => {
    const res = await api.post("/users/register", { name, email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      router("/home");
    }
    return res.data;
  };

  const handleLogin = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      router("/home");
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router("/");
  };

  const getHistoryOfUser = async () => {
    const res = await api.get("/meetings/my-meetings");
    return res.data;
  };

  const value = {
    user,
    setUser,
    loading,
    handleRegister,
    handleLogin,
    logout,
    getHistoryOfUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

