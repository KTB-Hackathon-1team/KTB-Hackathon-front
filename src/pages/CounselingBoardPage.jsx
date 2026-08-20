import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ChevronRight,
  Compass,
  Ellipsis,
  Home,
  MessageCircleHeart,
  NotebookTabs,
  Trash2,
} from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Link, useNavigate, useParams } from "react-router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import useSWRMutation from "swr/mutation";
import { CHILDREN_KEY } from "@/api/childrenApi";
import {
  counselingSessionsKey,
  createCounselingSession,
  deleteCounselingSession,
} from "@/api/counselingApi";
import { Brand } from "@/components/Brand";
import { CounselingCreateModal } from "@/components/modals/CounselingCreateModal";
import { CounselingDeleteModal } from "@/components/modals/CounselingDeleteModal";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/Card";
import { useChild } from "@/hooks/useChild";
import { formatDate, getAge } from "@/utils/date";
import { getErrorMessage } from "@/utils/errors";
import "./CounselingBoardPage.css";

export function CounselingBoardPage() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const childProfileId = Number(childId);
  const isValidChildId = Number.isInteger(childProfileId) && childProfileId > 0;
  const { selectChild } = useChild();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingSession, setDeletingSession] = useState(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const {
    data: children,
    error: childrenError,
    isLoading: isChildrenLoading,
  } = useSWR(CHILDREN_KEY, { refreshInterval: 9 * 60 * 1000 });

  const child = useMemo(
    () => children?.find((profile) => profile.id === childProfileId) ?? null,
    [childProfileId, children],
  );

  useEffect(() => {
    if (child) selectChild(child.id);
  }, [child, selectChild]);

  const sessionBasePath = counselingSessionsKey(isValidChildId ? childProfileId : 0);
  const {
    data: sessionPages,
    error: sessionsError,
    isLoading: isSessionsLoading,
    size,
    setSize,
    mutate: mutateSessions,
  } = useSWRInfinite((pageIndex, previousPage) => {
    if (!isValidChildId) return null;
    if (previousPage && !previousPage.hasNext) return null;
    const cursor =
      pageIndex > 0 && previousPage?.nextCursorId
        ? `&cursorId=${previousPage.nextCursorId}`
        : "";
    return `${sessionBasePath}?size=5${cursor}`;
  });

  const sessions = sessionPages?.flatMap((page) => page.items) ?? [];
  const hasNext = sessionPages?.at(-1)?.hasNext ?? false;

  const { trigger: createSession, isMutating } = useSWRMutation(
    sessionBasePath,
    (_, { arg }) => createCounselingSession(childProfileId, arg),
  );

  const handleCreate = useCallback(async (event) => {
    event.preventDefault();
    setCreateError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!title || !content) {
      setCreateError("상황 제목과 자세한 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      const created = await createSession({ title, content });
      if (!created) return;
      await mutateSessions();
      form.reset();
      setIsCreateOpen(false);
      navigate(`/children/${childProfileId}/counseling/${created.id}`);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  }, [childProfileId, createSession, mutateSessions, navigate]);

  const handleDelete = useCallback(async () => {
    if (!deletingSession) return;
    setDeleteError("");
    setIsDeletingSession(true);

    try {
      await deleteCounselingSession(childProfileId, deletingSession.id);
      await mutateSessions();
      setDeletingSession(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeletingSession(false);
    }
  }, [childProfileId, deletingSession, mutateSessions]);

  if (!isValidChildId) {
    return <InvalidChildState message="올바르지 않은 아이 주소입니다." />;
  }

  if (isChildrenLoading) {
    return <main className="counseling-board-state">아이 정보를 불러오는 중...</main>;
  }

  if (childrenError || !child) {
    return (
      <InvalidChildState
        message={childrenError?.message ?? "아이 정보를 찾을 수 없습니다."}
      />
    );
  }

  return (
    <main className="counseling-board-page">
      <div className="counseling-board-layout">
        <aside className="child-sidebar">
          <Brand />
          <div className="child-sidebar__profile">
            <Avatar className="child-sidebar__avatar" size="lg">
              <AvatarImage src={child.profileImageUrl ?? undefined} alt={`${child.name} 프로필`} />
              <AvatarFallback>{child.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <strong>{child.name}이</strong>
            <span>
              만 {getAge(child.birthDate)}세 · {child.gender === "MALE" ? "남아" : "여아"}
            </span>
          </div>

          <nav className="child-sidebar__nav" aria-label="아이 공간 메뉴">
            <span className="child-sidebar__nav-item child-sidebar__nav-item--active">
              <Home /> 오늘의 공간
            </span>
            <span className="child-sidebar__nav-item">
              <NotebookTabs /> 상담 기록
            </span>
            <span className="child-sidebar__nav-item">
              <Compass /> 육아 길잡이
            </span>
          </nav>

          <Button
            variant="ghost"
            className="child-sidebar__back"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft /> 아이 선택으로 돌아가기
          </Button>
        </aside>

        <div className="counseling-board-main">
          <header className="counseling-board-mobile-header">
            <Brand />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft /> 아이 선택
            </Button>
          </header>

          <section className="counseling-board-content">
            <header className="counseling-board-heading">
              <span>{child.name}이의 마음 공간</span>
              <h1>오늘은 어떤 일이 있었나요?</h1>
              <p>상황을 들려주시면 코코아가 다음 단계를 안내할게요.</p>
            </header>

            <Card className="new-counseling-card">
              <CardContent>
                <div>
                  <CardTitle>새로운 상담 시작하기</CardTitle>
                  <CardDescription>
                    갈등 상황을 먼저 남기고, 아이와 대화할 준비를 시작해요.
                  </CardDescription>
                  <Button
                    className="new-counseling-card__button"
                    onClick={() => {
                      setCreateError("");
                      setIsCreateOpen(true);
                    }}
                  >
                    상황 작성하기 <ArrowRight />
                  </Button>
                </div>
                <span className="new-counseling-card__icon"><MessageCircleHeart /></span>
              </CardContent>
            </Card>

            <section className="session-section" aria-labelledby="recent-counseling-title">
              <header>
                <h2 id="recent-counseling-title">최근 상담 기록</h2>
                <p>{child.name}이와 나눈 상담 상황을 최신순으로 확인할 수 있어요.</p>
              </header>

              {sessionsError && (
                <Alert className="session-section__error">
                  <AlertCircle />
                  <AlertDescription>{sessionsError.message}</AlertDescription>
                </Alert>
              )}

              {isSessionsLoading ? (
                <div className="session-section__loading">상담 기록을 불러오는 중...</div>
              ) : sessions.length ? (
                <div className="session-list">
                  {sessions.map((session) => (
                    <div className="session-list__item" key={session.id}>
                      <Link
                        to={`/children/${childProfileId}/counseling/${session.id}`}
                        className="session-list__link"
                      >
                        <Card className="session-card">
                          <CardContent>
                            <span className="session-card__icon"><BookOpenText /></span>
                            <span className="session-card__body">
                              <span className="session-card__date">{formatDate(session.date)}</span>
                              <strong>{session.title}</strong>
                              <span className="session-card__summary">{session.content}</span>
                            </span>
                            <span className="session-card__action">
                              <span>기록 보기</span>
                              <ChevronRight />
                            </span>
                          </CardContent>
                        </Card>
                      </Link>

                      <DropdownMenuPrimitive.Root>
                        <DropdownMenuPrimitive.Trigger asChild>
                          <Button
                            className="session-card__menu"
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${session.title} 상담 기록 관리`}
                          >
                            <Ellipsis />
                          </Button>
                        </DropdownMenuPrimitive.Trigger>
                        <DropdownMenuPrimitive.Portal>
                          <DropdownMenuPrimitive.Content
                            className="session-menu"
                            align="end"
                            sideOffset={6}
                          >
                            <DropdownMenuPrimitive.Item
                              className="session-menu__item session-menu__item--destructive"
                              onSelect={() => {
                                setDeleteError("");
                                setDeletingSession(session);
                              }}
                            >
                              <Trash2 /> 삭제
                            </DropdownMenuPrimitive.Item>
                          </DropdownMenuPrimitive.Content>
                        </DropdownMenuPrimitive.Portal>
                      </DropdownMenuPrimitive.Root>
                    </div>
                  ))}
                </div>
              ) : !sessionsError ? (
                <Card className="session-empty">
                  <CardContent>
                    <span className="session-empty__icon"><NotebookTabs /></span>
                    <strong>아직 상담 기록이 없어요</strong>
                    <p>첫 번째 상황을 남기면 이곳에 기록이 쌓여요.</p>
                  </CardContent>
                </Card>
              ) : null}

              {hasNext && (
                <div className="session-section__more">
                  <Button variant="outline" onClick={() => void setSize(size + 1)}>
                    기록 더 보기
                  </Button>
                </div>
              )}
            </section>

            <nav className="mobile-child-nav" aria-label="모바일 아이 공간 메뉴">
              <span className="mobile-child-nav__item mobile-child-nav__item--active">
                <Home />오늘
              </span>
              <span className="mobile-child-nav__item"><NotebookTabs />기록</span>
              <span className="mobile-child-nav__item"><Compass />길잡이</span>
            </nav>
          </section>
        </div>
      </div>

      <CounselingCreateModal
        open={isCreateOpen}
        childName={child.name}
        isSubmitting={isMutating}
        error={createError}
        onSubmit={handleCreate}
        onClose={() => setIsCreateOpen(false)}
      />

      <CounselingDeleteModal
        session={deletingSession}
        isDeleting={isDeletingSession}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeletingSession(null)}
      />
    </main>
  );
}

function InvalidChildState({ message }) {
  return (
    <main className="invalid-child-state">
      <div>
        <AlertCircle />
        <h1>아이 공간을 열 수 없어요</h1>
        <p>{message}</p>
        <Button asChild>
          <Link to="/dashboard"><ArrowLeft /> 아이 선택으로 돌아가기</Link>
        </Button>
      </div>
    </main>
  );
}
