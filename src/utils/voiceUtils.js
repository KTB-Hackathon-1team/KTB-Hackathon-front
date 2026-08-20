const CHILD_MIC = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
};

const NEARBY_SPEECH_LOUDNESS = 0.01;
const SPEECH_START_HOLD_MS = 120;
const SPEECH_FLICKER_ALLOW_MS = 80;
const SPEECH_TAIL_MS = 500;
const CATCH_FIRST_SOUND_MS = 300;

export function canStartVoiceCall() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof RTCPeerConnection !== "undefined" &&
    typeof Audio !== "undefined"
  );
}

export async function openChildMicrophone() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { ...CHILD_MIC, voiceIsolation: true },
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: CHILD_MIC });
  }
}

export function stopChildMicrophone(stream) {
  stream.getTracks().forEach((track) => track.stop());
}

function speechLoudness(data) {
  let sum = 0;
  for (const sample of data) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / data.length);
}

export async function openNearbySpeechInput(rawStream, onLevel) {
  const context = new AudioContext();
  if (context.state === "suspended") await context.resume();

  const source = context.createMediaStreamSource(rawStream);
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 120;

  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.35;

  const delay = context.createDelay(0.5);
  delay.delayTime.value = CATCH_FIRST_SOUND_MS / 1000;
  const gain = context.createGain();
  gain.gain.value = 0;
  const destination = context.createMediaStreamDestination();

  source.connect(highpass);
  highpass.connect(analyser);
  highpass.connect(delay);
  delay.connect(gain);
  gain.connect(destination);

  const samples = new Uint8Array(analyser.fftSize);
  let aboveSince = null;
  let belowSince = null;
  let speechUntil = 0;
  let wasOpen = false;
  let frame = 0;
  let lastEmit = 0;

  const tick = (now) => {
    analyser.getByteTimeDomainData(samples);
    const rms = speechLoudness(samples);

    if (rms >= NEARBY_SPEECH_LOUDNESS) {
      belowSince = null;
      if (aboveSince === null) aboveSince = now;
      if (now - aboveSince >= SPEECH_START_HOLD_MS) speechUntil = now + SPEECH_TAIL_MS;
    } else if (aboveSince !== null) {
      if (belowSince === null) belowSince = now;
      if (now - belowSince >= SPEECH_FLICKER_ALLOW_MS) {
        aboveSince = null;
        belowSince = null;
      }
    }

    const open = now < speechUntil + CATCH_FIRST_SOUND_MS;
    const time = context.currentTime;
    if (open && !wasOpen) {
      gain.gain.cancelScheduledValues(time);
      gain.gain.setValueAtTime(1, time);
    } else if (!open && wasOpen) {
      gain.gain.setTargetAtTime(0, time, 0.015);
    }
    wasOpen = open;

    if (now - lastEmit >= 100) {
      lastEmit = now;
      onLevel({ rms, open });
    }
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
  return {
    stream: destination.stream,
    stop() {
      cancelAnimationFrame(frame);
      source.disconnect();
      highpass.disconnect();
      delay.disconnect();
      gain.disconnect();
      analyser.disconnect();
      void context.close();
      stopChildMicrophone(rawStream);
    },
  };
}

export function isUtterance(item) {
  return item.type === "message" && item.role !== "system";
}

export function spokenText(item) {
  if (item.type !== "message") return "";
  return item.content
    .map((part) => {
      if ("text" in part) return part.text;
      if ("transcript" in part) return part.transcript ?? "";
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function toDialoguePayload(history) {
  const turns = history.filter(isUtterance).flatMap((item) => {
    const text = spokenText(item);
    if (!text || (item.role !== "user" && item.role !== "assistant")) return [];
    return [{ role: item.role, text, itemId: item.itemId, status: item.status }];
  });

  return {
    turns,
    text: turns.length
      ? turns
          .map((turn) => `${turn.role === "user" ? "아이" : "에이전트"}: ${turn.text}`)
          .join("\n")
      : "(대화 이력 없음)",
  };
}
