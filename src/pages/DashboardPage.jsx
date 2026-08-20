import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Ellipsis,
  Info,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Controller, useForm } from "react-hook-form";
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
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuth } from "@/hooks/useAuth";
import { useChild } from "@/hooks/useChild";
import { getAge } from "@/utils/date";
import { getErrorMessage } from "@/utils/errors";
import "./DashboardPage.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
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
  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { name: "", birthDate: "", gender: "" } });
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    register: registerEdit,
    reset: resetEdit,
    setError: setEditError,
    formState: { errors: editErrors },
  } = useForm({ defaultValues: { name: "", birthDate: "", gender: "" } });

  useEffect(() => {
    if (children.length && !children.some((child) => child.id === selectedChildId)) {
      selectChild(children[0].id);
    }
  }, [children, selectChild, selectedChildId]);

  const handleRegister = useCallback(async (data) => {
    clearErrors("root");
    setNotice("");
    const selectedImage = data.profileImage?.[0];
    const image = selectedImage?.size ? selectedImage : undefined;

    try {
      const result = await registerChild({
        input: {
          name: data.name,
          birthDate: data.birthDate,
          gender: data.gender,
        },
        image,
      });
      if (!result) return;
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
      reset();
      setIsDialogOpen(false);
    } catch (mutationError) {
      setError("root", { message: getErrorMessage(mutationError) });
    }
  }, [clearErrors, mutate, registerChild, reset, selectChild, setError]);

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
    resetEdit({
      name: child.name,
      birthDate: child.birthDate,
      gender: child.gender,
    });
    setEditingChild(child);
  }, [resetEdit]);

  const handleUpdate = useCallback(async (data) => {
    if (!editingChild) return;
    setIsUpdating(true);
    try {
      const updated = await updateChild(editingChild.id, data);
      await mutate(
        (current = []) => current.map((child) => child.id === updated.id ? updated : child),
        { revalidate: false },
      );
      setNotice(`${updated.name}이의 정보가 수정되었어요.`);
      setEditingChild(null);
    } catch (updateError) {
      setEditError("root", { message: getErrorMessage(updateError) });
    } finally {
      setIsUpdating(false);
    }
  }, [editingChild, mutate, setEditError]);

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
                  clearErrors();
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
                    <><strong>{selectedChild.name}</strong>이를 선택했어요</>
                  ) : (
                    "먼저 아이를 선택해 주세요"
                  )}
                </span>
                <Button
                  className="selection-panel__button"
                  disabled={!selectedChild}
                  onClick={() => selectedChild && navigate("/talk")}
                >
                  {selectedChild ? `${selectedChild.name}이와 시작하기` : "아이 선택하기"}
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!isMutating) setIsDialogOpen(open);
        }}
      >
        <DialogContent className="child-dialog">
          <DialogHeader>
            <span className="child-dialog__eyebrow">새 프로필</span>
            <DialogTitle className="child-dialog__title">아이 등록</DialogTitle>
            <DialogDescription>
              아이에게 맞는 대화를 준비할 수 있도록 알려주세요.
            </DialogDescription>
          </DialogHeader>
          <form className="child-form" onSubmit={handleSubmit(handleRegister)} noValidate>
            <div className="form-field">
              <Label htmlFor="child-name">이름</Label>
              <Input
                id="child-name"
                maxLength={30}
                placeholder="예: 민준"
                aria-invalid={Boolean(errors.name)}
                className="child-form__input"
                {...register("name", {
                  setValueAs: (value) => value.trim(),
                  required: "이름을 입력해 주세요.",
                })}
              />
              {errors.name && <p className="form-field__error">{errors.name.message}</p>}
            </div>

            <div className="form-field">
              <Label htmlFor="child-birth-date">생년월일</Label>
              <Input
                id="child-birth-date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                aria-invalid={Boolean(errors.birthDate)}
                className="child-form__input"
                {...register("birthDate", {
                  required: "생년월일을 입력해 주세요.",
                  validate: (value) =>
                    value <= new Date().toISOString().slice(0, 10) ||
                    "생년월일은 오늘 이후일 수 없어요.",
                })}
              />
              {errors.birthDate && <p className="form-field__error">{errors.birthDate.message}</p>}
            </div>

            <div className="form-field">
              <Label>성별</Label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "성별을 선택해 주세요." }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="child-form__select"
                      aria-invalid={Boolean(errors.gender)}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="선택해 주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">남아</SelectItem>
                      <SelectItem value="FEMALE">여아</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="form-field__error">{errors.gender.message}</p>}
            </div>

            <div className="form-field">
              <Label htmlFor="child-image">
                프로필 사진 <span className="child-form__optional">(선택)</span>
              </Label>
              <Input
                id="child-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(errors.profileImage)}
                className="child-form__file"
                {...register("profileImage", {
                  validate: (files) => {
                    const image = files?.[0];
                    if (!image) return true;
                    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
                      return "프로필 사진은 JPEG, PNG, WebP 형식만 사용할 수 있어요.";
                    }
                    return image.size <= MAX_IMAGE_SIZE || "프로필 사진은 5MB 이하로 선택해 주세요.";
                  },
                })}
              />
              {errors.profileImage && <p className="form-field__error">{errors.profileImage.message}</p>}
            </div>

            <Alert className="child-form__info">
              <Info />
              <AlertDescription>
                JPEG, PNG, WebP 파일을 최대 5MB까지 등록할 수 있어요. 아이 생성 후 사진이 이어서 업로드됩니다.
              </AlertDescription>
            </Alert>

            {errors.root?.message && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isMutating}
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isMutating} className="child-form__submit">
                {isMutating ? "등록하는 중..." : "등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingChild)}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setEditingChild(null);
        }}
      >
        <DialogContent className="child-dialog">
          <DialogHeader>
            <span className="child-dialog__eyebrow">프로필 관리</span>
            <DialogTitle className="child-dialog__title">아이 정보 수정</DialogTitle>
            <DialogDescription>등록된 아이 정보를 변경할 수 있어요.</DialogDescription>
          </DialogHeader>
          <form className="child-form" onSubmit={handleEditSubmit(handleUpdate)} noValidate>
            <div className="form-field">
              <Label htmlFor="edit-child-name">이름</Label>
              <Input
                id="edit-child-name"
                maxLength={30}
                aria-invalid={Boolean(editErrors.name)}
                className="child-form__input"
                {...registerEdit("name", {
                  setValueAs: (value) => value.trim(),
                  required: "이름을 입력해 주세요.",
                })}
              />
              {editErrors.name && <p className="form-field__error">{editErrors.name.message}</p>}
            </div>

            <div className="form-field">
              <Label htmlFor="edit-child-birth-date">생년월일</Label>
              <Input
                id="edit-child-birth-date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                aria-invalid={Boolean(editErrors.birthDate)}
                className="child-form__input"
                {...registerEdit("birthDate", {
                  required: "생년월일을 입력해 주세요.",
                  validate: (value) =>
                    value <= new Date().toISOString().slice(0, 10) ||
                    "생년월일은 오늘 이후일 수 없어요.",
                })}
              />
              {editErrors.birthDate && <p className="form-field__error">{editErrors.birthDate.message}</p>}
            </div>

            <div className="form-field">
              <Label>성별</Label>
              <Controller
                name="gender"
                control={editControl}
                rules={{ required: "성별을 선택해 주세요." }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="child-form__select"
                      aria-invalid={Boolean(editErrors.gender)}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="선택해 주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">남아</SelectItem>
                      <SelectItem value="FEMALE">여아</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {editErrors.gender && <p className="form-field__error">{editErrors.gender.message}</p>}
            </div>

            {editErrors.root?.message && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{editErrors.root.message}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => setEditingChild(null)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isUpdating} className="child-form__submit">
                {isUpdating ? "수정하는 중..." : "수정하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deletingChild)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingChild(null);
        }}
      >
        <DialogContent className="child-delete-dialog" showCloseButton={!isDeleting}>
          <DialogHeader>
            <span className="child-dialog__eyebrow">프로필 관리</span>
            <DialogTitle className="child-dialog__title">아이 프로필 삭제</DialogTitle>
            <DialogDescription>
              {deletingChild?.name}이의 프로필과 연결된 상담 기록, 대화, 분석 결과가 모두 삭제되며 되돌릴 수 없어요.
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
              disabled={isDeleting}
              onClick={() => setDeletingChild(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              <Trash2 /> {isDeleting ? "삭제하는 중..." : "삭제하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
