import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isReviewer = user && (user.role === "reviewer" || user.role === "admin");
  const isAdmin = user && user.role === "admin";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">NoteHub</Link>

      <div className="nav-links">
        <Link to="/">Browse</Link>
        <Link to="/communities">Communities</Link>
        {user && <Link to="/upload">Upload</Link>}
        {user && <Link to="/saved">Saved</Link>}
        {user && <Link to="/my-reviews">My reviews</Link>}
        {user && <Link to="/points">Points</Link>}
        {user && <Link to="/feedback">Feedback</Link>}
        {isReviewer && <Link to="/review/queue">Approval queue</Link>}
        {isAdmin && <Link to="/admin/reviewers">Reviewers</Link>}
        {isAdmin && <Link to="/admin/feedback">All feedback</Link>}
      </div>

      <div className="nav-user">
        {user ? (
          <>
            <span className="nav-name">{user.name} ({user.role})</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
