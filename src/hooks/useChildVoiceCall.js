import { useCallback, useEffect, useRef, useState } from "react";
import {
  OpenAIRealtimeWebRTC,
  RealtimeAgent,
  RealtimeSession,
} from "@openai/agents/realtime";
import {
  CHILD_AGENT_INSTRUCTIONS,
  CHILD_AGENT_MODEL,
  childAgentCallConfig,
  requestRealtimeClientSecret,
} from "@/api/voiceApi";
import { openChildMicrophone, openNearbySpeechInput } from "@/utils/voiceUtils";

function errorMessage(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

export function useChildVoiceCall() {
  const sessionRef = useRef(null);
  const audioRef = useRef(null);
  const micStopRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [nearbySpeech, setNearbySpeech] = useState(null);

  const endCall = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    micStopRef.current?.();
    micStopRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
    setNearbySpeech(null);
    setStatus("idle");
  }, []);

  useEffect(() => () => endCall(), [endCall]);

  const startCall = useCallback(async () => {
    endCall();
    setError(null);
    setHistory([]);
    setStatus("connecting");

    try {
      const { clientSecret } = await requestRealtimeClientSecret();
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audioRef.current = audio;

      const rawMic = await openChildMicrophone();
      const nearby = await openNearbySpeechInput(rawMic, setNearbySpeech);
      micStopRef.current = nearby.stop;

      const session = new RealtimeSession(
        new RealtimeAgent({ name: "코코아", instructions: CHILD_AGENT_INSTRUCTIONS }),
        {
          transport: new OpenAIRealtimeWebRTC({
            audioElement: audio,
            mediaStream: nearby.stream,
          }),
          model: CHILD_AGENT_MODEL,
          config: childAgentCallConfig(),
        },
      );

      session.on("history_updated", setHistory);
      session.on("audio_start", () => setStatus("speaking"));
      session.on("audio_stopped", () => setStatus("connected"));
      session.on("audio_interrupted", () => setStatus("connected"));
      session.on("error", (event) => {
        setError(errorMessage(event.error));
        setStatus("error");
      });
      sessionRef.current = session;

      await session.connect({ apiKey: clientSecret });
      setStatus((current) => (current === "speaking" ? current : "connected"));
    } catch (caught) {
      sessionRef.current?.close();
      sessionRef.current = null;
      micStopRef.current?.();
      micStopRef.current = null;
      audioRef.current = null;
      setNearbySpeech(null);
      setError(errorMessage(caught));
      setStatus("error");
    }
  }, [endCall]);

  return { status, error, history, nearbySpeech, startCall, endCall };
}
