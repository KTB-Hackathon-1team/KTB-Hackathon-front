import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Compass,
  Ellipsis,
  Home,
  MessageCircleHeart,
  NotebookTabs,
  Plus,
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
                              className="session-menu__item"
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

          </section>
        </div>
      </div>

      <CounselingCreateModal
        open={isCreateOpen}
        onOpenChange={(open) => !isMutating && setIsCreateOpen(open)}
      >
        <DialogContent className="counseling-dialog">
          <DialogHeader>
            <span className="counseling-dialog__eyebrow">새로운 상담</span>
            <DialogTitle className="counseling-dialog__title">어떤 일이 있었나요?</DialogTitle>
            <DialogDescription>
              상황을 편하게 적어주시면 {child.name}이에게 맞는 상담을 준비할게요.
            </DialogDescription>
          </DialogHeader>
          <form className="counseling-form" onSubmit={handleCreate}>
            <div className="form-field">
              <Label htmlFor="counseling-title">상황 제목</Label>
              <Input
                id="counseling-title"
                name="title"
                maxLength={200}
                required
                placeholder="예: 학원 숙제 때문에 갈등이 생겼어요"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="counseling-content">자세한 내용</Label>
              <Textarea
                id="counseling-content"
                name="content"
                required
                className="counseling-form__textarea"
                placeholder="오늘 있었던 상황과 서로 나눈 말을 편하게 적어주세요."
              />
            </div>
            {createError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={() => setIsCreateOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isMutating} className="counseling-form__submit">
                {isMutating ? "만드는 중..." : "상담 만들기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </CounselingCreateModal>

      <Dialog
        open={Boolean(deletingSession)}
        onOpenChange={(open) => {
          if (!open && !isDeletingSession) setDeletingSession(null);
        }}
      >
        <DialogContent className="counseling-delete-dialog" showCloseButton={!isDeletingSession}>
          <DialogHeader>
            <span className="counseling-dialog__eyebrow">상담 기록 관리</span>
            <DialogTitle className="counseling-dialog__title">상담 기록 삭제</DialogTitle>
            <DialogDescription>
              ‘{deletingSession?.title}’ 기록과 연결된 대화, 분석 결과, 녹음 정보가 모두 삭제되며 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingSession}
              onClick={() => setDeletingSession(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingSession}
              onClick={() => void handleDelete()}
            >
              <Trash2 /> {isDeletingSession ? "삭제하는 중..." : "삭제하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
