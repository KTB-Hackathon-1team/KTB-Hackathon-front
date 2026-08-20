import { useState } from "react";
import { sendDialogue } from "@/api/voiceApi";
import { useChildVoiceCall } from "@/hooks/useChildVoiceCall";
import {
  canStartVoiceCall,
  isUtterance,
  spokenText,
  toDialoguePayload,
} from "@/utils/voiceUtils";
import "./VoiceTalkPage.css";

const STATUS_LABEL = {
  idle: "대화 시작",
  connecting: "연결 중",
  connected: "듣는 중",
  speaking: "말하는 중",
  error: "다시 시도",
};

export function VoiceTalkPage() {
  const ready = canStartVoiceCall();
  const [sendError, setSendError] = useState("");
  const { status, error, history, nearbySpeech, startCall, endCall } = useChildVoiceCall();
  const inCall = status === "connected" || status === "speaking";
  const utterances = history.filter(isUtterance);
  const message = sendError || error || (!ready ? "이 브라우저에서는 음성 대화를 사용할 수 없습니다." : "");

  async function handleCircleClick() {
    setSendError("");
    if (!inCall) {
      await startCall();
      return;
    }

    const dialogue = toDialoguePayload(history);
    endCall();
    try {
      await sendDialogue(dialogue);
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  const soundScale = nearbySpeech?.open ? Math.min(1.12, 1 + nearbySpeech.rms * 3) : 1;

  return (
    <main className="voice-page">
      <button
        type="button"
        disabled={!ready || status === "connecting"}
        onClick={() => void handleCircleClick()}
        aria-label={`${STATUS_LABEL[status]}. ${message}`.trim()}
        title={message || STATUS_LABEL[status]}
        className={`voice-orb voice-orb--${status}`}
        style={{ "--voice-scale": soundScale }}
      >
        {STATUS_LABEL[status]}
      </button>

      <p className="visually-hidden" aria-live="polite">{message || STATUS_LABEL[status]}</p>

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
