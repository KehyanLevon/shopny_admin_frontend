import type { RouteObject } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { RequireAuth } from "../components/auth/RequireAuth";

export const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AdminLayout>
          <DashboardPage />
        </AdminLayout>
      </RequireAuth>
    ),
  },
];
