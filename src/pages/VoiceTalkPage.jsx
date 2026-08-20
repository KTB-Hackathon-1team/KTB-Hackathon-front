import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { counselingDetailKey, handoffCounselingSession } from "@/api/counselingApi";
import { useChildVoiceCall } from "@/hooks/useChildVoiceCall";
import {
  canStartVoiceCall,
  isUtterance,
  spokenText,
  toDialoguePayload,
} from "@/utils/voiceUtils";
import { getErrorMessage } from "@/utils/errors";
import "./VoiceTalkPage.css";

const STATUS_LABEL = {
  idle: "대화 시작",
  connecting: "연결 중",
  connected: "듣는 중",
  speaking: "말하는 중",
  error: "다시 시도",
};

export function VoiceTalkPage() {
  const navigate = useNavigate();
  const { childId, sessionId } = useParams();
  const childProfileId = Number(childId);
  const counselingSessionId = Number(sessionId);
  const hasValidSession =
    Number.isInteger(childProfileId) &&
    childProfileId > 0 &&
    Number.isInteger(counselingSessionId) &&
    counselingSessionId > 0;
  const detailPath = `/children/${childProfileId}/counseling/${counselingSessionId}`;
  const detailKey = hasValidSession
    ? counselingDetailKey(childProfileId, counselingSessionId)
    : null;
  const { data: counselingDetail, error: sessionError, isLoading: isLoadingSession } = useSWR(detailKey);
  const ready = canStartVoiceCall();
  const [sendError, setSendError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDialogue, setPendingDialogue] = useState(null);
  const submitDialogue = useCallback(async (dialogue) => {
    setPendingDialogue(dialogue);
    setSendError("");
    setIsSubmitting(true);
    try {
      await handoffCounselingSession(childProfileId, counselingSessionId, dialogue);
      setPendingDialogue(null);
      navigate(detailPath, { replace: true });
    } catch (caught) {
      setSendError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }, [childProfileId, counselingSessionId, detailPath, navigate]);
  const handleAgentEnded = useCallback((callHistory) => {
    void submitDialogue(toDialoguePayload(callHistory));
  }, [submitDialogue]);
  const { status, error, history, nearbySpeech, startCall, endCall } = useChildVoiceCall({ onEnded: handleAgentEnded });
  const inCall = status === "connected" || status === "speaking";
  const voiceSessionReady = counselingDetail?.status === "RECORDING";
  const utterances = history.filter(isUtterance);
  const message =
    sendError ||
    error ||
    (!hasValidSession ? "대화 세션 정보를 찾을 수 없습니다." : "") ||
    (sessionError ? getErrorMessage(sessionError) : "") ||
    (!isLoadingSession && !voiceSessionReady ? "상담을 시작한 후 음성 대화를 이용해 주세요." : "") ||
    (!ready ? "이 브라우저에서는 음성 대화를 사용할 수 없습니다." : "");

  async function handleCircleClick() {
    if (!hasValidSession || !voiceSessionReady || isSubmitting) return;
    setSendError("");
    if (pendingDialogue) {
      await submitDialogue(pendingDialogue);
      return;
    }
    if (!inCall) {
      await startCall();
      return;
    }

    if (status === "speaking") return;

    const dialogue = toDialoguePayload(history);
    endCall();
    await submitDialogue(dialogue);
  }

  const soundScale = nearbySpeech?.open ? Math.min(1.12, 1 + nearbySpeech.rms * 3) : 1;

  return (
    <main className="voice-page">
      <button
        type="button"
        className="voice-back-button"
        onClick={() => navigate(-1)}
        aria-label="이전 페이지로 돌아가기"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        <span>뒤로가기</span>
      </button>

      <button
        type="button"
        disabled={!ready || !voiceSessionReady || isSubmitting || status === "connecting" || status === "speaking"}
        onClick={() => void handleCircleClick()}
        aria-label={`${pendingDialogue ? "다시 전송" : STATUS_LABEL[status]}. ${message}`.trim()}
        title={message || (pendingDialogue ? "다시 전송" : STATUS_LABEL[status])}
        className={`voice-orb voice-orb--${status}`}
        style={{ "--voice-scale": soundScale }}
      >
        {pendingDialogue ? "다시 전송" : STATUS_LABEL[status]}
      </button>

      <p className="visually-hidden" aria-live="polite">{message || (pendingDialogue ? "다시 전송" : STATUS_LABEL[status])}</p>

      {import.meta.env.DEV && (
        <section className="voice-transcript" aria-label="개발용 대화 전사">
          {message && <p className="voice-transcript__error">{message}</p>}
          {utterances.length ? (
            <ol className="voice-transcript__list">
              {utterances.map((item) => (
                <li key={item.itemId}>
                  <strong>{item.role === "user" ? "아이" : "코코아"}</strong>
                  {spokenText(item) || "(음성 인식 중…)"}
                </li>
              ))}
            </ol>
          ) : (
            <p className="voice-transcript__empty">전사 대기 중…</p>
          )}
        </section>
      )}
    </main>
  );
}
