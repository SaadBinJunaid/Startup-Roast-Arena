// components/ProtectedRoute.jsx
// Wraps pages that require login. While we check the session we show a loader;
// if the user is not logged in we send them to the login page.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container page">
        <Loader message="Checking your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
