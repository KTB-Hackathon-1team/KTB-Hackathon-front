import { apiRequest } from "./apiClient";

export const CHILDREN_KEY = "/api/children";

export function getChildren() {
  return apiRequest(CHILDREN_KEY);
}

export function createChild(input) {
  return apiRequest(CHILDREN_KEY, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function uploadChildProfileImage(childProfileId, file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(`/api/children/${childProfileId}/profile-image`, {
    method: "POST",
    body: formData,
  });
}
