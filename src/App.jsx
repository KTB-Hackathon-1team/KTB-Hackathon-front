import { RouterProvider } from "react-router/dom";
import { AuthProvider } from "@/context/AuthContext";
import { ChildProvider } from "@/context/ChildContext";
import { router } from "@/routes/router";

export default function App() {
  return (
    <AuthProvider>
      <ChildProvider>
        <RouterProvider router={router} />
      </ChildProvider>
    </AuthProvider>
  );
}
