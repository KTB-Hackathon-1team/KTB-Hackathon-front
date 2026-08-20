import { useEffect, useState } from "react";
import { AlertCircle, Camera, Info, Mars, Venus } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
import { getErrorMessage } from "@/utils/errors";
import { localDateString } from "@/utils/date";
import "./ChildProfileModal.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_VALUES = { name: "", birthDate: "", gender: "", profileImage: undefined };

export function ChildProfileModal({
  open,
  editingChild,
  isCreating,
  isUpdating,
  onCreate,
  onUpdate,
  onClose,
}) {
  const isEditMode = Boolean(editingChild);
  const isSubmitting = isEditMode ? isUpdating : isCreating;
  const {
    clearErrors,
    control,
    handleSubmit,
    register,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_VALUES });
  const profileImageFile = watch("profileImage")?.[0];
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const inputIdPrefix = isEditMode ? "edit-child" : "child";

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [profileImageFile]);

  useEffect(() => {
    if (editingChild) {
      reset({
        name: editingChild.name,
        birthDate: editingChild.birthDate,
        gender: editingChild.gender,
        profileImage: undefined,
      });
    } else if (open) {
      reset(DEFAULT_VALUES);
    }
  }, [editingChild, open, reset]);

  async function handleCreate(data) {
    clearErrors();

    try {
      const result = await onCreate({
        input: {
          name: data.name,
          birthDate: data.birthDate,
          gender: data.gender,
        },
        image: data.profileImage?.[0],
      });

      if (!result) return;
      reset(DEFAULT_VALUES);
      onClose();
    } catch (caught) {
      setError("root", { message: getErrorMessage(caught) });
    }
  }

  async function handleUpdate(data) {
    if (!editingChild) return;
    clearErrors();

    try {
      await onUpdate(editingChild.id, {
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
      });
      onClose();
    } catch (caught) {
      setError("root", { message: getErrorMessage(caught) });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="child-dialog">
        <DialogHeader>
          <span className="child-dialog__eyebrow">
            {isEditMode ? "프로필 관리" : "새 프로필"}
          </span>
          <DialogTitle className="child-dialog__title">
            {isEditMode ? "아이 정보 수정" : "아이 등록"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "등록된 아이 정보를 변경할 수 있어요."
              : "아이에게 맞는 대화를 준비할 수 있도록 알려주세요."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="child-form"
          onSubmit={handleSubmit(isEditMode ? handleUpdate : handleCreate)}
          noValidate
        >
          {!isEditMode && (
            <div className="form-field child-form__avatar-field">
              <Label>프로필 사진 <span className="child-form__optional">(선택)</span></Label>
              <label className="child-form__avatar-picker" htmlFor="child-image">
                <Avatar className="child-form__avatar-preview" size="lg">
                  <AvatarImage src={profileImagePreview || undefined} alt="선택한 프로필 사진 미리보기" />
                  <AvatarFallback><Camera aria-hidden="true" /></AvatarFallback>
                </Avatar>
                <span className="child-form__avatar-badge"><Camera aria-hidden="true" /></span>
                <span className="child-form__avatar-hint">
                  {profileImageFile ? "사진 변경" : "사진 선택"}
                </span>
              </label>
              <Input
                id="child-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(errors.profileImage)}
                aria-describedby={errors.profileImage ? "child-image-error" : undefined}
                className="child-form__file-input"
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
              {errors.profileImage && <p className="form-field__error" id="child-image-error">{errors.profileImage.message}</p>}
            </div>
          )}

          <div className="form-field">
            <Label htmlFor={`${inputIdPrefix}-name`}>이름</Label>
            <Input
              id={`${inputIdPrefix}-name`}
              maxLength={30}
              placeholder="예: 민준"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${inputIdPrefix}-name-error` : undefined}
              className="child-form__input"
              {...register("name", {
                setValueAs: (value) => value.trim(),
                required: "이름을 입력해 주세요.",
              })}
            />
            {errors.name && <p className="form-field__error" id={`${inputIdPrefix}-name-error`}>{errors.name.message}</p>}
          </div>

          <div className="form-field">
            <Label htmlFor={`${inputIdPrefix}-birth-date`}>생년월일</Label>
            <Input
              id={`${inputIdPrefix}-birth-date`}
              type="date"
              max={localDateString()}
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={errors.birthDate ? `${inputIdPrefix}-birth-date-error` : undefined}
              className="child-form__input"
              {...register("birthDate", {
                required: "생년월일을 입력해 주세요.",
                validate: (value) =>
                  value <= localDateString() ||
                  "생년월일은 오늘 이후일 수 없어요.",
              })}
            />
            {errors.birthDate && <p className="form-field__error" id={`${inputIdPrefix}-birth-date-error`}>{errors.birthDate.message}</p>}
          </div>

          <div className="form-field">
            <Label>성별</Label>
            <Controller
              name="gender"
              control={control}
              rules={{ required: "성별을 선택해 주세요." }}
              render={({ field }) => (
                <RadioGroup.Root
                  className="child-form__gender-options"
                  aria-label="성별"
                  aria-invalid={Boolean(errors.gender)}
                  aria-describedby={errors.gender ? `${inputIdPrefix}-gender-error` : undefined}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <RadioGroup.Item
                    value="MALE"
                    className="child-form__gender-option child-form__gender-option--male"
                    ref={field.ref}
                  >
                    <Mars aria-hidden="true" />
                    <span>남아</span>
                  </RadioGroup.Item>
                  <RadioGroup.Item
                    value="FEMALE"
                    className="child-form__gender-option child-form__gender-option--female"
                  >
                    <Venus aria-hidden="true" />
                    <span>여아</span>
                  </RadioGroup.Item>
                </RadioGroup.Root>
              )}
            />
            {errors.gender && <p className="form-field__error" id={`${inputIdPrefix}-gender-error`}>{errors.gender.message}</p>}
          </div>

          {!isEditMode && (
            <Alert className="child-form__info">
              <Info />
              <AlertDescription>
                JPEG, PNG, WebP 파일을 최대 5MB까지 등록할 수 있어요. 아이 생성 후 사진이 이어서 업로드됩니다.
              </AlertDescription>
            </Alert>
          )}

          {errors.root?.message && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} className="child-form__submit">
              {isSubmitting
                ? isEditMode ? "수정하는 중..." : "등록하는 중..."
                : isEditMode ? "수정하기" : "등록하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
