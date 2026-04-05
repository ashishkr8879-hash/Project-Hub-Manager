import { useState, useEffect } from "react";
import { type LoginResponse } from "@workspace/api-client-react";
import { useLocation } from "wouter";

export function useAuth() {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (e) {
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (userData: LoginResponse) => {
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    setLocation("/login");
  };

  return { user, isLoaded, login, logout };
}
