import React, { useEffect } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { routes } from "./router/routes";
import { useAuthStore, AUTH_EVENT_KEY } from "./store/authStore";
const App: React.FC = () => {
  const logoutFromOtherTab = useAuthStore((s) => s.logoutFromOtherTab);
  const initFromCookies = useAuthStore((s) => s.initFromCookies);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue) as {
          type: "login" | "logout";
          ts: number;
        };
        if (payload.type === "logout") {
          logoutFromOtherTab();
        } else if (payload.type === "login") {
          void initFromCookies();
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [logoutFromOtherTab, initFromCookies]);
  const element = useRoutes([
    ...routes,
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return element;
};

export default App;
