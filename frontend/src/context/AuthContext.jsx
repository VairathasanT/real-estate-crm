import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        return null;
      }

      const parsedUser = JSON.parse(savedUser);

      // Support both:
      // { id, name, email, role }
      // and { user: { id, name, email, role } }
      const normalizedUser =
        parsedUser?.user || parsedUser;

      if (
        !normalizedUser ||
        !normalizedUser.id ||
        !normalizedUser.role
      ) {
        localStorage.removeItem("user");
        return null;
      }

      return {
        id: normalizedUser.id,
        name: normalizedUser.name || "",
        email: normalizedUser.email || "",
        role: String(normalizedUser.role).toUpperCase(),
      };
    } catch (error) {
      console.error(
        "Failed to restore authentication:",
        error
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return null;
    }
  });

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user: loggedInUser } =
      response.data;

    if (!token || !loggedInUser) {
      throw new Error(
        "Invalid login response from server."
      );
    }

    const normalizedUser = {
      id: loggedInUser.id,
      name: loggedInUser.name || "",
      email: loggedInUser.email || "",
      role: String(
        loggedInUser.role || ""
      ).toUpperCase(),
    };

    // Always write token and user together.
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify(normalizedUser)
    );

    // Update React state only after localStorage
    // contains the matching token + user.
    setUser(normalizedUser);

    return normalizedUser;
  };

  const logout = () => {
    // Remove authentication data first.
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Then clear React authentication state.
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin:
      String(user?.role || "").toUpperCase() ===
      "ADMIN",
    isSales:
      String(user?.role || "").toUpperCase() ===
      "SALES",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}