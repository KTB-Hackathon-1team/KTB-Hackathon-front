import { AlertCircle, Trash2 } from "lucide-react";
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
import "./CounselingDeleteModal.css";

export function CounselingDeleteModal({
  session,
  isDeleting,
  error,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog
      open={Boolean(session)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent className="counseling-delete-dialog" showCloseButton={!isDeleting}>
        <DialogHeader>
          <span className="counseling-delete-dialog__eyebrow">기록 관리</span>
          <DialogTitle className="counseling-delete-dialog__title">기록 삭제</DialogTitle>
          <DialogDescription>
            ‘{session?.title}’ 기록과 연결된 대화, 분석 결과, 녹음 정보가 모두 삭제되며 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isDeleting} onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
            <Trash2 /> {isDeleting ? "삭제하는 중..." : "삭제하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
