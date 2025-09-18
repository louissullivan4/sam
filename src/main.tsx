import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@carbon/styles/css/styles.css";
import AppShell from "./shell/AppShell";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Pending from "./pages/Pending";
import PublicForm from "./pages/PublicForm";
import Requests from "./pages/Request";
import Assessments from "./pages/Assessments";
import AssessmentDetail from "./pages/AssessmentDetail";
import AdminUsers from "./pages/AdminUsers";
import RequireAuth from "./components/RequireAuth";
import "./app.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <Requests />
          </RequireAuth>
        ),
      },
      {
        path: "requests",
        element: (
          <RequireAuth>
            <Requests />
          </RequireAuth>
        ),
      },
      {
        path: "requests/:id",
        element: (
          <RequireAuth>
            <AssessmentDetail />
          </RequireAuth>
        ),
      },
      {
        path: "assessments",
        element: (
          <RequireAuth>
            <Assessments />
          </RequireAuth>
        ),
      },
      {
        path: "assessments/:id",
        element: (
          <RequireAuth>
            <AssessmentDetail />
          </RequireAuth>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireAuth>
            <AdminUsers />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/pending", element: <Pending /> },
  { path: "/form", element: <PublicForm /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
