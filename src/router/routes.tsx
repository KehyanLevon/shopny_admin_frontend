import type { RouteObject } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import SectionsPage from "../pages/sections/SectionsPage";
import CategoriesPage from "../pages/categories/CategoriesPage";
import ProductsPage from "../pages/products/ProductsPage";
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
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { path: "sections", element: <SectionsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "products", element: <ProductsPage /> },
    ],
  },
];
