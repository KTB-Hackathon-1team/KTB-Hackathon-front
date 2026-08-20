import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, Ellipsis, Info, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { useNavigate } from "react-router";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import {
  CHILDREN_KEY,
  createChild,
  deleteChild,
  updateChild,
  uploadChildProfileImage,
} from "@/api/childrenApi";
import { Brand } from "@/components/Brand";
import { ChildDeleteModal } from "@/components/modals/ChildDeleteModal";
import { ChildProfileModal } from "@/components/modals/ChildProfileModal";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useChild } from "@/hooks/useChild";
import { getAge } from "@/utils/date";
import { getErrorMessage } from "@/utils/errors";
import "./DashboardPage.css";

const PROFILE_TONES = [
  "profile-tone--peach",
  "profile-tone--green",
  "profile-tone--yellow",
  "profile-tone--blue",
];

async function registerChildMutation(_, { arg }) {
  const created = await createChild(arg.input);
  if (!arg.image) return { profile: created, imageUploadFailed: false };
  try {
    return {
      profile: await uploadChildProfileImage(created.id, arg.image),
      imageUploadFailed: false,
    };
  } catch {
    return { profile: created, imageUploadFailed: true };
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedChildId, selectChild } = useChild();
  const { mutate: mutateAll } = useSWRConfig();
  const {
    data: children = [],
    error,
    isLoading,
    mutate,
  } = useSWR(CHILDREN_KEY, { refreshInterval: 9 * 60 * 1000 });
  const { trigger: registerChild, isMutating } = useSWRMutation(
    CHILDREN_KEY,
    registerChildMutation,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [deletingChild, setDeletingChild] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (children.length && !children.some((child) => child.id === selectedChildId)) {
      selectChild(children[0].id);
    }
  }, [children, selectChild, selectedChildId]);

  const handleRegister = useCallback(async (data) => {
    setNotice("");

    const result = await registerChild(data);
    if (!result) return null;
    await mutate(
      (current = []) => [
        ...current.filter((child) => child.id !== result.profile.id),
        result.profile,
      ],
      { revalidate: false },
    );
    selectChild(result.profile.id);
    setNotice(
      result.imageUploadFailed
        ? `${result.profile.name}이 등록되었지만 사진은 업로드하지 못했어요.`
        : `${result.profile.name}이 새로 등록되고 선택되었어요.`,
    );
    return result;
  }, [mutate, registerChild, selectChild]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      await mutateAll(() => true, undefined, { revalidate: false });
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, mutateAll, navigate]);

  const openEditDialog = useCallback((child) => {
    setEditingChild(child);
  }, []);

  const handleUpdate = useCallback(async (childId, data) => {
    setIsUpdating(true);
    try {
      const updated = await updateChild(childId, data);
      await mutate(
        (current = []) => current.map((child) => child.id === updated.id ? updated : child),
        { revalidate: false },
      );
      setNotice(`${updated.name}이의 정보가 수정되었어요.`);
      return updated;
    } finally {
      setIsUpdating(false);
    }
  }, [mutate]);

  const handleDelete = useCallback(async () => {
    if (!deletingChild) return;
    setDeleteError("");
    setIsDeleting(true);
    try {
      await deleteChild(deletingChild.id);
      const remainingChildren = children.filter((child) => child.id !== deletingChild.id);
      await mutate(remainingChildren, { revalidate: false });
      selectChild(remainingChildren[0]?.id ?? null);
      setNotice(`${deletingChild.name}이의 프로필이 삭제되었어요.`);
      setDeletingChild(null);
    } catch (deleteRequestError) {
      setDeleteError(getErrorMessage(deleteRequestError));
    } finally {
      setIsDeleting(false);
    }
  }, [children, deletingChild, mutate, selectChild]);

  if (!user) return null;
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? null;

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__topbar">
        <Brand />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut />
          {isLoggingOut ? "로그아웃 중" : "로그아웃"}
        </Button>
      </header>

      <section className="dashboard-page__content" aria-labelledby="child-picker-title">
        <span className="dashboard-page__eyebrow">우리 가족 프로필</span>
        <h1 id="child-picker-title">누구와 함께 시작할까요?</h1>
        <p className="dashboard-page__intro">
          아이를 선택하면 코코아가 마음에 맞는 대화를 준비할게요.
        </p>

        {error && (
          <Alert className="dashboard-page__error">
            <AlertCircle />
            <AlertDescription>
              <strong>{error.message}</strong>
              <span>목록 조회 API가 준비되지 않았더라도 새 아이는 등록할 수 있어요.</span>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="dashboard-page__loading" aria-live="polite">
            아이 프로필을 불러오는 중...
          </div>
        ) : (
          <>
            <div className="profile-grid" aria-label="아이 프로필 목록">
              {children.map((child, index) => {
                const selected = child.id === selectedChildId;
                return (
                  <div className="profile-card-item" key={child.id}>
                    <button
                      className="profile-card-button"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        selectChild(child.id);
                        setNotice("");
                      }}
                    >
                      <Card className={`profile-card${selected ? " profile-card--selected" : ""}`}>
                        {selected && (
                          <span className="profile-card__check"><Check /></span>
                        )}
                        <Avatar className="profile-card__avatar" size="lg">
                          <AvatarImage
                            className="profile-card__image"
                            src={child.profileImageUrl ?? undefined}
                            alt={`${child.name} 프로필`}
                          />
                          <AvatarFallback
                            className={`profile-card__fallback ${PROFILE_TONES[index % PROFILE_TONES.length]}`}
                          >
                            {child.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      </Card>
                      <strong className="profile-card-button__name">{child.name}</strong>
                      <small className="profile-card-button__meta">
                        만 {getAge(child.birthDate)}세 · {child.gender === "MALE" ? "남아" : "여아"}
                      </small>
                    </button>

                    <DropdownMenuPrimitive.Root>
                      <DropdownMenuPrimitive.Trigger asChild>
                        <Button
                          className="profile-card__menu"
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${child.name} 프로필 관리`}
                        >
                          <Ellipsis />
                        </Button>
                      </DropdownMenuPrimitive.Trigger>
                      <DropdownMenuPrimitive.Portal>
                        <DropdownMenuPrimitive.Content
                          className="profile-menu"
                          align="end"
                          sideOffset={6}
                        >
                          <DropdownMenuPrimitive.Item
                            className="profile-menu__item"
                            onSelect={() => openEditDialog(child)}
                          >
                            <Pencil /> 정보 수정
                          </DropdownMenuPrimitive.Item>
                          <DropdownMenuPrimitive.Item
                            className="profile-menu__item profile-menu__item--destructive"
                            onSelect={() => {
                              setDeleteError("");
                              setDeletingChild(child);
                            }}
                          >
                            <Trash2 /> 삭제
                          </DropdownMenuPrimitive.Item>
                        </DropdownMenuPrimitive.Content>
                      </DropdownMenuPrimitive.Portal>
                    </DropdownMenuPrimitive.Root>
                  </div>
                );
              })}

              <button
                className="profile-card-button"
                type="button"
                onClick={() => {
                  setIsDialogOpen(true);
                }}
              >
                <Card className="profile-card profile-card--add">
                  <span className="profile-card__add-icon"><Plus /></span>
                </Card>
                <strong className="profile-card-button__name">아이 등록</strong>
                <small className="profile-card-button__meta">새 프로필 추가</small>
              </button>
            </div>

            {!children.length && !error && (
              <p className="dashboard-page__empty">
                아직 등록된 아이가 없어요. 아이 등록 카드를 눌러 시작해 주세요.
              </p>
            )}

            <Card className="selection-panel">
              <CardContent>
                <span>
                  {selectedChild ? (
                    <><strong>{selectedChild.name}</strong>(이)를 선택했어요</>
                  ) : (
                    "먼저 아이를 선택해 주세요"
                  )}
                </span>
                <Button
                  className="selection-panel__button"
                  disabled={!selectedChild}
                  onClick={() => selectedChild && navigate(`/children/${selectedChild.id}/counseling`)}
                >
                  {selectedChild ? `${selectedChild.name}(이)의 상담 공간으로 가기` : "아이 선택하기"}
                  <ArrowRight />
                </Button>
              </CardContent>
            </Card>

            {notice && (
              <Alert className="dashboard-page__notice">
                <Info />
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </section>

      <ChildProfileModal
        open={isDialogOpen || Boolean(editingChild)}
        editingChild={editingChild}
        isCreating={isMutating}
        isUpdating={isUpdating}
        onCreate={handleRegister}
        onUpdate={handleUpdate}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingChild(null);
        }}
      />

      <ChildDeleteModal
        child={deletingChild}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeletingChild(null)}
      />
    </main>
  );
}
