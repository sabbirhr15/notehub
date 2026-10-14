import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// roles = "any" (any logged-in user) or a list such as ["reviewer", "admin"].
// This only hides pages. The real check always happens again on the server.
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (Array.isArray(roles) && !roles.includes(user.role)) {
    return (
      <div className="placeholder">
        <h2>Not allowed</h2>
        <p>You do not have permission to open this page.</p>
      </div>
    );
  }
  return children;
}
