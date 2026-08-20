import childAgentSession from "@/config/childAgentSession.json";
import { apiRequest } from "./apiClient";

export const CHILD_AGENT_MODEL = childAgentSession.session.model;
export const CHILD_AGENT_INSTRUCTIONS = childAgentSession.session.instructions;

export function childAgentCallConfig() {
  const { audio, output_modalities: outputModalities } = childAgentSession.session;
  const { input, output } = audio;

  return {
    outputModalities,
    audio: {
      input: {
        format: { type: "audio/pcm", rate: input.format.rate },
        transcription: input.transcription,
        noiseReduction: { type: input.noise_reduction.type },
        turnDetection: input.turn_detection,
      },
      output: {
        format: { type: "audio/pcm", rate: output.format.rate },
        voice: output.voice,
        speed: output.speed,
      },
    },
  };
}

export function requestRealtimeClientSecret() {
  return apiRequest("/api/voice/realtime-token", { method: "POST" });
}
