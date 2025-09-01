import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, userRole, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking authentication..." />;

  if (!session || !session.user){
    return <Navigate to="/login" state={{ from: location.pathname}} replace/>;
  }
   
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
