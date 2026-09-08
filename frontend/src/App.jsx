import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Properties from "./pages/Properties";
import CRMLayout from "./layouts/CRMLayout";
import Bookings from "./pages/Bookings";
import Employees from "./pages/Employees";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />


      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CRMLayout>
              <Dashboard />
            </CRMLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <CRMLayout>
              <Leads />
            </CRMLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/properties"
        element={
          <ProtectedRoute>
            <CRMLayout>
              <Properties />
            </CRMLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <CRMLayout>
              <Bookings />
            </CRMLayout>
          </ProtectedRoute>
        }
      />


      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <CRMLayout>
                <Employees />
              </CRMLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />


      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>

      <AuthProvider>
        <AppRoutes />
      </AuthProvider>

    </BrowserRouter>
  );
}