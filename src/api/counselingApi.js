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

export function startCounselingSession(childProfileId, sessionId) {
  return apiRequest(`${counselingDetailKey(childProfileId, sessionId)}/start`, {
    method: "POST",
  });
}

export function handoffCounselingSession(childProfileId, sessionId, payload) {
  return apiRequest(`${counselingDetailKey(childProfileId, sessionId)}/handoff`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteCounselingSession(childProfileId, sessionId) {
  return apiRequest(counselingDetailKey(childProfileId, sessionId), {
    method: "DELETE",
  });
}
