import { apiRequest } from "./apiClient";

export function counselingSessionsKey(childProfileId) {
  return `/api/children/${childProfileId}/counseling-sessions`;
}

export function counselingDetailKey(childProfileId, sessionId) {
  return `${counselingSessionsKey(childProfileId)}/${sessionId}`;
}

export function createCounselingSession(childProfileId, input) {
  return apiRequest(counselingSessionsKey(childProfileId), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCounselingSessionDetail(childProfileId, sessionId) {
  return apiRequest(counselingDetailKey(childProfileId, sessionId));
}
