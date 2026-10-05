import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import { useAppPreferences } from "../components/PreferencesContext";
import { useAuthText } from "../components/auth/AuthTextContext";

const workflow = [
  { title: "wfNeed", detail: "wfNeedText" },
  { title: "wfMeaning", detail: "wfMeaningText" },
  { title: "wfMatch", detail: "wfMatchText" },
  { title: "wfVerify", detail: "wfVerifyText" },
  { title: "wfCertify", detail: "wfCertifyText" },
  { title: "wfDecision", detail: "wfDecisionText" }
];

function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 800 : window.innerHeight
  );

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  return viewportHeight;
}

function WorkflowStep({ step, index, isLast, activeStep, onActivate, viewportHeight }) {
  const t = useAuthText();
  const { theme } = useAppPreferences();
  const stepRef = useRef(null);
  const isInView = useInView(stepRef, {
    once: true,
    amount: 0.51,
    margin: `${-Math.round(viewportHeight * 0.7)}px 0px ${-Math.round(viewportHeight * 0.2)}px 0px`
  });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isInView) onActivate(index);
  }, [index, isInView, onActivate]);

  return (
    <li
      ref={stepRef}
      className={`workflow-step${isInView ? " is-active" : ""}${activeStep === index ? " is-current" : ""}`}
      aria-current={activeStep === index ? "step" : undefined}
    >
      <div className="workflow-marker-column" aria-hidden="true">
        <motion.span
          className="step-index"
          initial={shouldReduceMotion ? false : { scale: 0.86, backgroundColor: theme === "dark" ? "#172033" : "#f2f4f7" }}
          animate={isInView ? { scale: 1, backgroundColor: theme === "dark" ? "rgba(139, 168, 245, 0.16)" : "rgba(38, 71, 150, 0.1)" } : undefined}
          transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: "easeOut" }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
        {!isLast && (
          <span className="workflow-connector-track">
            <motion.span
              className="workflow-connector-progress"
              initial={shouldReduceMotion ? false : { scaleY: 0 }}
              animate={{ scaleY: isInView ? 1 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.48, delay: shouldReduceMotion ? 0 : 0.12, ease: "easeOut" }}
            />
          </span>
        )}
      </div>

      <motion.div
        className="workflow-step-content"
        initial={shouldReduceMotion ? false : { opacity: 0.45, x: 12 }}
        animate={isInView ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: "easeOut" }}
      >
        <span className="workflow-step-label">{t("stage")} {String(index + 1).padStart(2, "0")}</span>
        <h3>{step.title}</h3>
        <p>{step.detail}</p>
      </motion.div>
    </li>
  );
}

export default function HowItWorksPage() {
  const t = useAuthText();
  const [activeStep, setActiveStep] = useState(-1);
  const viewportHeight = useViewportHeight();

  return (
    <div className="page-shell about-shell">
      <Navbar />

      <main className="container about-page">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "How It Works" }]} />
        <section className="about-hero">
          <div className="about-copy">
            <span className="section-kicker">
              <span className="kicker-dot">✦</span>
              {t("howKicker")}
            </span>
            <h1>{t("howTitle")}</h1>
            <p>{t("howIntro")}</p>
          </div>
          <div className="about-metric-card">
            <strong>{t("stepsFromQuery")}</strong>
            <span>{t("queryToDecision")}</span>
          </div>
        </section>

        <section className="workflow-section">
          <div className="section-heading">
            <span className="section-kicker small-kicker">
              <span className="kicker-dot">✦</span>
              {t("processFlow")}
            </span>
            <h2>{t("workflowTitle")}</h2>
          </div>

          <ol className="workflow-flow" aria-label="ProcureIQ procurement journey">
            {workflow.map((step, index) => (
              <WorkflowStep
                key={step.title}
                step={{ title: t(step.title), detail: t(step.detail) }}
                index={index}
                isLast={index === workflow.length - 1}
                activeStep={activeStep}
                onActivate={setActiveStep}
                viewportHeight={viewportHeight}
              />
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
