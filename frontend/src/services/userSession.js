export function clearUserSession() {
  localStorage.removeItem("procureiq_user");
  sessionStorage.removeItem("procureiq_access_token");
  sessionStorage.removeItem("procureiq_recommendation_state");
}
