import React, { useEffect } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { routes } from "./router/routes";
import { useAuthStore, AUTH_EVENT_KEY } from "./store/authStore";

const App: React.FC = () => {
  useEffect(() => {
    const { initFromCookies, logoutFromOtherTab } = useAuthStore.getState();

    void initFromCookies();

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
          void initFromCookies(true);
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const element = useRoutes([
    ...routes,
    { path: "*", element: <Navigate to="/" replace /> },
  ]);

  return element;
};

export default App;
