import { Navigate } from "react-router-dom";
import { hasUsableAccessToken } from "../services/apiClient";


export default function ProtectedRoute({
  children,
  adminOnly = false
}) {

  const admin = localStorage.getItem("procureiq_admin");


  if (adminOnly) {

    if (!admin) {
      return <Navigate to="/admin/login" replace />;
    }

    return children;
  }


  if (!hasUsableAccessToken()) {
    return <Navigate to="/login" replace />;
  }


  return children;
}
