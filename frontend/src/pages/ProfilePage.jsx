import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAppPreferences } from "../components/PreferencesContext";
import { useAuthText } from "../components/auth/AuthTextContext";
import { clearUserSession } from "../services/userSession";

const languageKeys = {
  en: "languageEnglish",
  hi: "languageHindi",
  mr: "languageMarathi"
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("procureiq_user") || "{}") || {};
  } catch {
    return {};
  }
}

function getInitials(name, email) {
  const displayName = name || email?.split("@")[0] || "";
  const parts = displayName.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || "U";
}

export default function ProfilePage() {
  const t = useAuthText();
  const navigate = useNavigate();
  const { language, theme } = useAppPreferences();
  const user = readStoredUser();
  const name = user.name || user.fullName || "";
  const email = user.email || "";
  const role = t("userRole");

  function logout() {
    clearUserSession();
    navigate("/");
  }

  return (
    <div className="page-shell profile-shell">
      <Navbar />
      <main className="container profile-main">
        <div className="profile-page-heading">
          <span className="section-kicker">{t("profile")}</span>
          <h1>{t("myProfile")}</h1>
        </div>

        <section className="profile-card" aria-label={t("myProfile")}>
          <header className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">
              {getInitials(name, email)}
            </div>
            <div>
              <h2>{name || t("notSpecified")}</h2>
              <p>{role}</p>
            </div>
          </header>

          <div className="profile-information-grid">
            <section className="profile-information-group">
              <h3>{t("personalInformation")}</h3>
              <dl>
                <div className="profile-information-row">
                  <dt>{t("profileName")}</dt>
                  <dd>{name || t("notSpecified")}</dd>
                </div>
                <div className="profile-information-row">
                  <dt>{t("profileEmail")}</dt>
                  <dd>{email || t("notSpecified")}</dd>
                </div>
                <div className="profile-information-row">
                  <dt>{t("profileRole")}</dt>
                  <dd>{role}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-information-group">
              <h3>{t("preferences")}</h3>
              <dl>
                <div className="profile-information-row">
                  <dt>{t("profileLanguage")}</dt>
                  <dd>{t(languageKeys[language] || languageKeys.en)}</dd>
                </div>
                <div className="profile-information-row">
                  <dt>{t("profileTheme")}</dt>
                  <dd>{t(theme === "dark" ? "darkMode" : "lightMode")}</dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="profile-actions">
            <Link to="/dashboard" className="secondary-btn">
              {t("backDashboard")}
            </Link>
            <button type="button" className="primary-btn" onClick={logout}>
              {t("profileLogout")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
