import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, userRole, loading } = useContext(AuthContext);

  if (loading) return <LoadingSpinner message="Checking authentication..." />;

  if (!session) return <Navigate to="/login" />;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
