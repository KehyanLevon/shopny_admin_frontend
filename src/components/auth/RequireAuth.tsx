import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const initFromCookies = useAuthStore((s) => s.initFromCookies);

  useEffect(() => {
    if (!initialized) {
      initFromCookies();
    }
  }, [initialized, initFromCookies]);

  if (!initialized || loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
