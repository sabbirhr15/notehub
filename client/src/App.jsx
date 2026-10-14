import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { routes } from "./routes.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path, element, access }) => (
          <Route
            key={path}
            path={path}
            element={access ? <ProtectedRoute roles={access}>{element}</ProtectedRoute> : element}
          />
        ))}
        <Route path="*" element={<div className="placeholder"><h2>Page not found</h2></div>} />
      </Route>
    </Routes>
  );
}
