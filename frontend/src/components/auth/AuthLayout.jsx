import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AuthTextContext } from "./AuthTextContext";

const translations = {
  en: {
    aiLabel: "AI-POWERED PROCUREMENT INTELLIGENCE",
    backHome: "← Back to Home",
    registerTitle: "Create your ProcureIQ account",
    registerSubtitle: "Get smarter access to Indian Standards and procurement intelligence.",
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to continue to your procurement intelligence workspace.",
    name: "Full Name",
    email: "Email Address",
    organization: "Organization",
    password: "Password",
    confirmPassword: "Confirm Password",
    createAccount: "Create Account",
    logIn: "Log In",
    alreadyAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    loginLink: "Login",
    createAccountLink: "Create an account",
    forgotPassword: "Forgot Password?",
    or: "OR",
    continueGoogle: "Continue with Google",
    continueMicrosoft: "Continue with Microsoft",
    registerVisualTitle: "Create your procurement workspace",
    registerVisualSubtitle: "Bring standards discovery and better decisions into one connected workspace.",
    loginVisualTitle: "Return to your procurement workspace",
    loginVisualSubtitle: "Pick up where your standards research left off.",
    searchCallout: "AI-Powered Standards Search",
    decisionCallout: "Smarter Procurement Decisions",
    accessCallout: "Access Indian Standards",
    intelligenceCallout: "AI-powered procurement intelligence",
    emailPlaceholder: "you@organization.com",
    namePlaceholder: "Your full name",
    organizationPlaceholder: "Organization name",
    passwordPlaceholder: "Enter your password",
    confirmPasswordPlaceholder: "Re-enter your password",
    mismatch: "Passwords do not match.",
    apiNotConfigured: "Authentication is not connected yet. Your information has not been submitted.",
    requestFailed: "We couldn't complete that request. Please try again.",
    registrationSuccess: "Your account was created. Sign in to continue.",
    registrationFailed: "We couldn't create your account. Please try again.",
    loginFailed: "We couldn't sign you in. Check your details and try again.",
    missingToken: "The authentication service did not return a sign-in token.",
    providerUnavailable: "This sign-in option is not connected yet.",
    forgotUnavailable: "Password recovery is not connected yet.",
    themeLight: "Switch to light mode",
    themeDark: "Switch to dark mode",
    language: "Language",
    lightMode: "Light",
    darkMode: "Dark"
  },
  hi: {
    aiLabel: "एआई-संचालित खरीद बुद्धिमत्ता",
    backHome: "← होम पर वापस जाएँ",
    registerTitle: "अपना ProcureIQ खाता बनाएँ",
    registerSubtitle: "भारतीय मानकों और खरीद बुद्धिमत्ता तक बेहतर पहुँच पाएँ।",
    loginTitle: "वापसी पर स्वागत है",
    loginSubtitle: "अपने खरीद बुद्धिमत्ता कार्यक्षेत्र में आगे बढ़ने के लिए साइन इन करें।",
    name: "पूरा नाम",
    email: "ईमेल पता",
    organization: "संस्था",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    createAccount: "खाता बनाएँ",
    logIn: "साइन इन",
    alreadyAccount: "पहले से खाता है?",
    noAccount: "खाता नहीं है?",
    loginLink: "लॉगिन",
    createAccountLink: "खाता बनाएँ",
    forgotPassword: "पासवर्ड भूल गए?",
    or: "या",
    continueGoogle: "Google से जारी रखें",
    continueMicrosoft: "Microsoft से जारी रखें",
    registerVisualTitle: "अपना खरीद कार्यक्षेत्र बनाएँ",
    registerVisualSubtitle: "मानक खोज और बेहतर निर्णयों को एक जुड़े हुए कार्यक्षेत्र में लाएँ।",
    loginVisualTitle: "अपने खरीद कार्यक्षेत्र में लौटें",
    loginVisualSubtitle: "जहाँ आपने मानकों का शोध छोड़ा था, वहीं से शुरू करें।",
    searchCallout: "एआई-संचालित मानक खोज",
    decisionCallout: "बेहतर खरीद निर्णय",
    accessCallout: "भारतीय मानकों तक पहुँचें",
    intelligenceCallout: "एआई-संचालित खरीद बुद्धिमत्ता",
    emailPlaceholder: "you@organization.com",
    namePlaceholder: "आपका पूरा नाम",
    organizationPlaceholder: "संस्था का नाम",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    confirmPasswordPlaceholder: "पासवर्ड फिर से दर्ज करें",
    mismatch: "पासवर्ड मेल नहीं खाते।",
    apiNotConfigured: "प्रमाणीकरण सेवा अभी जुड़ी नहीं है। आपकी जानकारी सबमिट नहीं की गई।",
    requestFailed: "अनुरोध पूरा नहीं हो सका। कृपया फिर से प्रयास करें।",
    registrationSuccess: "आपका खाता बन गया है। आगे बढ़ने के लिए साइन इन करें।",
    registrationFailed: "खाता नहीं बनाया जा सका। कृपया फिर से प्रयास करें।",
    loginFailed: "साइन इन नहीं हो सका। विवरण जाँचकर फिर से प्रयास करें।",
    missingToken: "प्रमाणीकरण सेवा ने साइन-इन टोकन नहीं लौटाया।",
    providerUnavailable: "यह साइन-इन विकल्प अभी जुड़ा नहीं है।",
    forgotUnavailable: "पासवर्ड पुनर्प्राप्ति अभी जुड़ी नहीं है।",
    themeLight: "लाइट मोड पर जाएँ",
    themeDark: "डार्क मोड पर जाएँ",
    language: "भाषा",
    lightMode: "लाइट",
    darkMode: "डार्क"
  },
  mr: {
    aiLabel: "एआय-आधारित खरेदी बुद्धिमत्ता",
    backHome: "← मुख्यपृष्ठावर परत जा",
    registerTitle: "तुमचे ProcureIQ खाते तयार करा",
    registerSubtitle: "भारतीय मानके आणि खरेदी बुद्धिमत्तेचा अधिक स्मार्ट वापर करा.",
    loginTitle: "पुन्हा स्वागत आहे",
    loginSubtitle: "तुमच्या खरेदी बुद्धिमत्ता कार्यक्षेत्रात पुढे जाण्यासाठी साइन इन करा.",
    name: "पूर्ण नाव",
    email: "ईमेल पत्ता",
    organization: "संस्था",
    password: "पासवर्ड",
    confirmPassword: "पासवर्डची पुष्टी करा",
    createAccount: "खाते तयार करा",
    logIn: "साइन इन",
    alreadyAccount: "आधीपासून खाते आहे?",
    noAccount: "खाते नाही?",
    loginLink: "लॉगिन",
    createAccountLink: "खाते तयार करा",
    forgotPassword: "पासवर्ड विसरलात?",
    or: "किंवा",
    continueGoogle: "Google सह पुढे जा",
    continueMicrosoft: "Microsoft सह पुढे जा",
    registerVisualTitle: "तुमचे खरेदी कार्यक्षेत्र तयार करा",
    registerVisualSubtitle: "मानक शोध आणि उत्तम निर्णय एका जोडलेल्या कार्यक्षेत्रात आणा.",
    loginVisualTitle: "तुमच्या खरेदी कार्यक्षेत्रात परत या",
    loginVisualSubtitle: "तुमचे मानक संशोधन जिथे थांबले होते तिथून पुढे सुरू करा.",
    searchCallout: "एआय-आधारित मानक शोध",
    decisionCallout: "अधिक स्मार्ट खरेदी निर्णय",
    accessCallout: "भारतीय मानकांमध्ये प्रवेश",
    intelligenceCallout: "एआय-आधारित खरेदी बुद्धिमत्ता",
    emailPlaceholder: "you@organization.com",
    namePlaceholder: "तुमचे पूर्ण नाव",
    organizationPlaceholder: "संस्थेचे नाव",
    passwordPlaceholder: "तुमचा पासवर्ड टाका",
    confirmPasswordPlaceholder: "पासवर्ड पुन्हा टाका",
    mismatch: "पासवर्ड जुळत नाहीत.",
    apiNotConfigured: "प्रमाणीकरण सेवा अद्याप जोडलेली नाही. तुमची माहिती पाठवलेली नाही.",
    requestFailed: "विनंती पूर्ण करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
    registrationSuccess: "तुमचे खाते तयार झाले. पुढे जाण्यासाठी साइन इन करा.",
    registrationFailed: "खाते तयार करता आले नाही. कृपया पुन्हा प्रयत्न करा.",
    loginFailed: "साइन इन करता आले नाही. तपशील तपासून पुन्हा प्रयत्न करा.",
    missingToken: "प्रमाणीकरण सेवेकडून साइन-इन टोकन मिळाले नाही.",
    providerUnavailable: "हा साइन-इन पर्याय अद्याप जोडलेला नाही.",
    forgotUnavailable: "पासवर्ड पुनर्प्राप्ती अद्याप जोडलेली नाही.",
    themeLight: "लाइट मोड निवडा",
    themeDark: "डार्क मोड निवडा",
    language: "भाषा",
    lightMode: "लाइट",
    darkMode: "डार्क"
  }
};

function readPreference(key, fallback, acceptedValues) {
  const saved = localStorage.getItem(key);
  return acceptedValues.includes(saved) ? saved : fallback;
}

function AuthHeader({ theme, setTheme, language, setLanguage, t }) {
  return (
    <header className="auth-topbar">
      <Link to="/" className="auth-topbar-brand" aria-label="ProcureIQ home">
        <img src="/assets/procureiq-logo.png" alt="" />
        <span>ProcureIQ</span>
      </Link>
      <div className="auth-header-controls">
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={() => {
            const nextTheme = theme === "light" ? "dark" : "light";
            localStorage.setItem("procureiq_theme", nextTheme);
            setTheme(nextTheme);
          }}
          aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
          title={theme === "light" ? t("themeDark") : t("themeLight")}
        >
          <span aria-hidden="true">{theme === "light" ? "◐" : "☼"}</span>
          <span className="auth-theme-label">{theme === "light" ? t("darkMode") : t("lightMode")}</span>
        </button>
        <label className="auth-language-control">
          <span className="visually-hidden">{t("language")}</span>
          <select
            value={language}
            onChange={(event) => {
              localStorage.setItem("procureiq_language", event.target.value);
              setLanguage(event.target.value);
            }}
            aria-label={t("language")}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </label>
      </div>
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
  const [theme, setTheme] = useState(() => readPreference("procureiq_theme", "light", ["light", "dark"]));
  const [language, setLanguage] = useState(() => readPreference("procureiq_language", "en", ["en", "hi", "mr"]));
  const t = (key) => translations[language][key] || translations.en[key] || key;
  const reduceMotion = useReducedMotion();

  return (
    <AuthTextContext.Provider value={t}>
      <div className={`auth-experience auth-theme-${theme} auth-layout-${mode}`}>
        <AuthHeader theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={t} />
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
    </AuthTextContext.Provider>
  );
}
