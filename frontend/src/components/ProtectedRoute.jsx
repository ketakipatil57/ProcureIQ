import { Navigate } from "react-router-dom";


export default function ProtectedRoute({
  children,
  adminOnly = false
}) {

  const user = localStorage.getItem("procureiq_user");
  const admin = localStorage.getItem("procureiq_admin");


  if (adminOnly) {

    if (!admin) {
      return <Navigate to="/admin/login" replace />;
    }

    return children;
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }


  return children;
}