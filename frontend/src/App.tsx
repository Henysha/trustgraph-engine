import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Layout } from "./components/Layout";
import { Alerts } from "./pages/Alerts";
import { Dashboard } from "./pages/Dashboard";
import { Groups } from "./pages/Groups";
import { ReviewCases } from "./pages/ReviewCases";
import { Transactions } from "./pages/Transactions";
import { Users } from "./pages/Users";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "groups", element: <Groups /> },
      { path: "transactions", element: <Transactions /> },
      { path: "alerts", element: <Alerts /> },
      { path: "review-cases", element: <ReviewCases /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
