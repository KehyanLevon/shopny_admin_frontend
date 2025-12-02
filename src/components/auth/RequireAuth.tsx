import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const initFromCookies = useAuthStore((s) => s.initFromCookies);

  useEffect(() => {
    initFromCookies(true);
  }, [initFromCookies, location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
