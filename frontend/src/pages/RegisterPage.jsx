import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { useAuthText } from "../components/auth/AuthTextContext";
import { registerUser } from "../services/authApi";

function RegisterForm() {
  const t = useAuthText();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage(t("mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({ fullName, email, organization, password });
      navigate("/login", {
        replace: true,
        state: { notice: t("registrationSuccess") }
      });
    } catch (error) {
      setMessage(error.code === "AUTH_API_NOT_CONFIGURED" ? t("apiNotConfigured") : error.message || t("registrationFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  function notifyProviderUnavailable() {
    setMessage(t("providerUnavailable"));
  }

  return (
      <div className="auth-form-content auth-register-content">
        <span className="auth-form-kicker">{t("aiLabel")}</span>
        <h1>{t("registerTitle")}</h1>
        <p className="auth-form-subtitle">{t("registerSubtitle")}</p>

        <form className="auth-fields auth-register-fields" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>{t("name")}</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>

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

          <label className="auth-field auth-field-wide">
            <span>{t("organization")}</span>
            <input
              type="text"
              name="organization"
              autoComplete="organization"
              placeholder={t("organizationPlaceholder")}
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>{t("password")}</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="auth-field">
            <span>{t("confirmPassword")}</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {message && <p className="auth-message auth-message-error auth-field-wide" role="status">{message}</p>}

          <button type="submit" className="auth-primary-button auth-field-wide" disabled={submitting}>
            {submitting ? "…" : t("createAccount")}
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
          {t("alreadyAccount")} <Link to="/login">{t("loginLink")}</Link>
        </p>
      </div>
  );
}

export default function RegisterPage() {
  return <AuthLayout mode="register"><RegisterForm /></AuthLayout>;
}
