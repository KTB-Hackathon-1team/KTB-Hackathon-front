import assert from "node:assert/strict";
import test from "node:test";
import { toDialoguePayload } from "../src/utils/voiceUtils.js";

test("대화 이력을 백엔드 전송 형식으로 변환한다", () => {
  const history = [
    {
      itemId: "user-1",
      type: "message",
      role: "user",
      status: "completed",
      content: [{ type: "input_audio", transcript: "오늘 속상했어." }],
    },
    {
      itemId: "tool-1",
      type: "function_call",
      name: "ignored",
      arguments: "{}",
    },
    {
      itemId: "assistant-1",
      type: "message",
      role: "assistant",
      status: "completed",
      content: [{ type: "output_text", text: "그랬구나. 이야기해 줘서 고마워." }],
    },
  ];

  assert.deepEqual(toDialoguePayload(history), {
    turns: [
      {
        role: "user",
        text: "오늘 속상했어.",
        itemId: "user-1",
        status: "completed",
      },
      {
        role: "assistant",
        text: "그랬구나. 이야기해 줘서 고마워.",
        itemId: "assistant-1",
        status: "completed",
      },
    ],
    text: "아이: 오늘 속상했어.\n에이전트: 그랬구나. 이야기해 줘서 고마워.",
  });
});
