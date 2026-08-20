import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/Alert";
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
import { Textarea } from "@/components/ui/Textarea";
import "./CounselingCreateModal.css";

export function CounselingCreateModal({
  open,
  childName,
  isSubmitting,
  error,
  onSubmit,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="counseling-dialog">
        <DialogHeader>
          <span className="counseling-dialog__eyebrow">새로운 상담</span>
          <DialogTitle className="counseling-dialog__title">어떤 일이 있었나요?</DialogTitle>
          <DialogDescription>
            상황을 편하게 적어주시면 {childName}이에게 맞는 상담을 준비할게요.
          </DialogDescription>
        </DialogHeader>

        <form className="counseling-form" onSubmit={onSubmit}>
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} className="counseling-form__submit">
              {isSubmitting ? "만드는 중..." : "상담 만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
