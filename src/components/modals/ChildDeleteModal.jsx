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
import "./ChildDeleteModal.css";

export function ChildDeleteModal({ child, isDeleting, error, onConfirm, onClose }) {
  return (
    <Dialog
      open={Boolean(child)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent className="child-delete-dialog" showCloseButton={!isDeleting}>
        <DialogHeader>
          <span className="child-delete-dialog__eyebrow">프로필 관리</span>
          <DialogTitle className="child-delete-dialog__title">아이 프로필 삭제</DialogTitle>
          <DialogDescription>
            {child?.name}이의 프로필과 연결된 상담 기록, 대화, 분석 결과가 모두 삭제되며 되돌릴 수 없어요.
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
