import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { useAuthText } from "../components/auth/AuthTextContext";
import { loginUser } from "../services/authApi";

function LoginForm() {
  const t = useAuthText();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(location.state?.notice || "");
  const [messageType, setMessageType] = useState(location.state?.notice ? "success" : "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");
    setSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      const token = response.accessToken || response.access_token || response.token;
      if (!token) {
        setMessage(t("missingToken"));
        setMessageType("error");
        return;
      }

      sessionStorage.setItem("procureiq_access_token", token);
      const userName = response.user?.fullName || response.user?.name || response.fullName || "";
      localStorage.setItem("procureiq_user", JSON.stringify({ email, name: userName }));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.code === "AUTH_API_NOT_CONFIGURED" ? t("apiNotConfigured") : error.message || t("loginFailed"));
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  function notifyProviderUnavailable() {
    setMessage(t("providerUnavailable"));
    setMessageType("error");
  }

  return (
      <div className="auth-form-content">
        <span className="auth-form-kicker">{t("aiLabel")}</span>
        <h1>{t("loginTitle")}</h1>
        <p className="auth-form-subtitle">{t("loginSubtitle")}</p>

        <form className="auth-fields" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{t("email")}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>{t("password")}</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <div className="auth-forgot-row">
            <button type="button" onClick={() => {
              setMessage(t("forgotUnavailable"));
              setMessageType("error");
            }}>{t("forgotPassword")}</button>
          </div>

          {message && <p className={`auth-message auth-message-${messageType}`} role="status">{message}</p>}

          <button type="submit" className="auth-primary-button" disabled={submitting}>
            {submitting ? "…" : t("logIn")}
          </button>
        </form>

        <div className="auth-divider"><span>{t("or")}</span></div>
        <div className="auth-provider-actions">
          <button type="button" className="auth-provider-button" onClick={notifyProviderUnavailable}>
            <span className="provider-g-mark" aria-hidden="true">G</span>
            {t("continueGoogle")}
          </button>
          <button type="button" className="auth-provider-button" onClick={notifyProviderUnavailable}>
            <span className="provider-m-mark" aria-hidden="true">M</span>
            {t("continueMicrosoft")}
          </button>
        </div>

        <p className="auth-switch-prompt">
          {t("noAccount")} <Link to="/register">{t("createAccountLink")}</Link>
        </p>
      </div>
  );
}

export default function LoginPage() {
  return <AuthLayout mode="login"><LoginForm /></AuthLayout>;
}
