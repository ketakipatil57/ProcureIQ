import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAuthText } from "./AuthTextContext";
import { PreferenceControls } from "../AppPreferences";
import { useAppPreferences } from "../PreferencesContext";


function AuthHeader() {
  return (
    <header className="auth-topbar">
      <Link to="/" className="auth-topbar-brand" aria-label="ProcureIQ home">
        <img src="/assets/procureiq-logo.png" alt="" />
        <span>ProcureIQ</span>
      </Link>
      <PreferenceControls />
    </header>
  );
}

function AuthIllustration({ mode, t }) {
  const isRegister = mode === "register";
  return (
    <motion.aside
      className={`auth-art-panel auth-art-${mode}`}
      initial={{ opacity: 0, x: isRegister ? 18 : -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      aria-label={isRegister ? t("registerVisualTitle") : t("loginVisualTitle")}
    >
      <div className="auth-art-topline">
        <span className="auth-art-eyebrow">{t("aiLabel")}</span>
        <span className="auth-art-status"><i /> {isRegister ? "60+" : "BIS"}</span>
      </div>
      <div className="workspace-illustration" aria-hidden="true">
        <div className="workspace-window">
          <div className="workspace-window-top">
            <span /><span /><span />
            <b>{isRegister ? t("searchCallout") : t("accessCallout")}</b>
          </div>
          <div className="workspace-body">
            <div className="workspace-sidebar"><i /><i /><i /><i /></div>
            <div className="workspace-content">
              <div className="workspace-query"><span>⌕</span><i /></div>
              <div className="workspace-result workspace-result-primary">
                <span className="workspace-result-mark">IS</span>
                <div><i /><i /></div>
                <b>94%</b>
              </div>
              <div className="workspace-result">
                <span className="workspace-result-mark red-mark">IS</span>
                <div><i /><i /></div>
                <b>87%</b>
              </div>
              <div className="workspace-result">
                <span className="workspace-result-mark">IS</span>
                <div><i /><i /></div>
                <b>82%</b>
              </div>
              <div className="workspace-chart"><i /><i /><i /><i /><i /><i /></div>
            </div>
          </div>
        </div>
        <motion.div
          className={`auth-callout auth-callout-${isRegister ? "top" : "left"}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.32 }}
        >
          <span className="auth-callout-icon">{isRegister ? "⌕" : "IS"}</span>
          <span>{isRegister ? t("searchCallout") : t("accessCallout")}</span>
        </motion.div>
        <motion.div
          className={`auth-callout auth-callout-${isRegister ? "bottom" : "right"}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23, duration: 0.32 }}
        >
          <span className="auth-callout-icon auth-callout-icon-red">{isRegister ? "↗" : "✦"}</span>
          <span>{isRegister ? t("decisionCallout") : t("intelligenceCallout")}</span>
        </motion.div>
      </div>
      <div className="auth-art-copy">
        <h2>{isRegister ? t("registerVisualTitle") : t("loginVisualTitle")}</h2>
        <p>{isRegister ? t("registerVisualSubtitle") : t("loginVisualSubtitle")}</p>
      </div>
      <span className="auth-art-accent auth-art-accent-blue" />
      <span className="auth-art-accent auth-art-accent-red" />
    </motion.aside>
  );
}

export default function AuthLayout({ mode, children }) {
  const { theme } = useAppPreferences();
  const t = useAuthText();
  const reduceMotion = useReducedMotion();

  return (
      <div className={`auth-experience auth-theme-${theme} auth-layout-${mode}`}>
        <AuthHeader />
        <div className="auth-back-home-wrap">
          <Link to="/" className="auth-back-home">{t("backHome")}</Link>
        </div>
        <main className="auth-layout-main">
          {mode === "login" && <AuthIllustration mode={mode} t={t} />}
          <motion.section
            className="auth-form-side"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.36, ease: "easeOut" }}
          >
            {children}
          </motion.section>
          {mode === "register" && <AuthIllustration mode={mode} t={t} />}
        </main>
      </div>
  );
}
