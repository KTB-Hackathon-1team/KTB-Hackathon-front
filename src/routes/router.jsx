import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { CounselingBoardPage } from "@/pages/CounselingBoardPage";
import { CounselingDetailPage } from "@/pages/CounselingDetailPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { useAuth } from "@/hooks/useAuth";

function RouteLoading({ message = "로그인 상태를 확인하는 중..." }) {
  return <main className="route-loading" aria-live="polite">{message}</main>;
}

function RootGate() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return <RouteLoading />;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function PublicOnlyRoute() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return <RouteLoading />;
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <span>404</span>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>주소가 변경되었거나 존재하지 않는 페이지예요.</p>
      <a href="/">처음 화면으로 돌아가기</a>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <RootGate /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    hydrateFallbackElement: <RouteLoading message="페이지를 불러오는 중..." />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      {
        path: "/children/:childId/counseling/:sessionId/talk",
        lazy: () => import("@/pages/VoiceTalkPage").then(({ VoiceTalkPage: Component }) => ({ Component })),
      },
      { path: "/children/:childId/counseling", element: <CounselingBoardPage /> },
      {
        path: "/children/:childId/counseling/:sessionId",
        element: <CounselingDetailPage />,
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
