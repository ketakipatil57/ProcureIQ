import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import NetworkBackground from "../components/NetworkBackground";
import { useAuthText } from "../components/auth/AuthTextContext";

const pillars = [
  {
    icon: "Aa",
    title: "semanticUnderstanding",
    description: "semanticDescription"
  },
  {
    icon: "文",
    title: "multilingualInput",
    description: "multilingualDescription"
  },
  {
    icon: "IS",
    title: "standardsIntelligence",
    description: "standardsDescription"
  },
  {
    icon: "✓",
    title: "complianceAwareness",
    description: "complianceDescription"
  }
];

const productJourney = [
  { title: "journeyNeed", detail: "journeyNeedText" },
  { title: "journeyAI", detail: "journeyAIText" },
  { title: "journeyStandards", detail: "journeyStandardsText" },
  { title: "journeyInfo", detail: "journeyInfoText" },
  { title: "journeyWorkflow", detail: "journeyWorkflowText" }
];

const techStack = ["React", "FastAPI", "Sentence Transformers", "Spring Boot", "Redis"];

const pillarContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } }
};

const pillarItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } }
};

const journeyItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function AboutPage() {
  const t = useAuthText();
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : "hidden";

  return (
    <div className="page-shell about-shell about-v2-shell">
      <Navbar />

      <main className="about-v2 container">
        <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "About" }]} />
        <section className="about-v2-hero">
          <div className="about-hero-network" aria-hidden="true">
            <NetworkBackground animate={!shouldReduceMotion} />
          </div>
          <motion.div
            className="about-v2-hero-copy"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
          >
            <span className="section-kicker">
              <span className="kicker-dot">✦</span>
              {t("aboutKicker")}
            </span>
            <h1>{t("aboutTitle")}</h1>
            <p>{t("aboutIntro")}</p>
          </motion.div>
          <div className="about-hero-accent" aria-hidden="true">
            <span>INTELLIGENCE</span>
            <i />
            <span>PROCUREMENT</span>
          </div>
        </section>

        <section className="about-v2-section about-pillars-section">
          <div className="about-v2-section-heading">
            <div>
              <span className="section-kicker small-kicker">
                <span className="kicker-dot">✦</span>
                {t("corePillars")}
              </span>
              <h2>{t("pillarsTitle")}</h2>
            </div>
            <p>{t("pillarsIntro")}</p>
          </div>

          <motion.div
            className="about-pillar-grid"
            variants={pillarContainer}
            initial={initial}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {pillars.map((pillar, index) => (
              <motion.article
                className="about-pillar-card"
                key={pillar.title}
                variants={pillarItem}
                whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.18, ease: "easeOut" } }}
              >
                <span className={`about-pillar-icon about-pillar-icon-${index + 1}`} aria-hidden="true">
                  {pillar.icon}
                </span>
                <h3>{t(pillar.title)}</h3>
                <p>{t(pillar.description)}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section className="about-v2-section about-idea-section">
          <div className="about-v2-section-heading about-idea-heading">
            <div>
              <span className="section-kicker small-kicker">
                <span className="kicker-dot">✦</span>
                {t("productIdea")}
              </span>
              <h2>{t("productIdeaTitle")}</h2>
            </div>
            <p>{t("productIdeaIntro")}</p>
          </div>

          <div className="about-idea-panel">
            <motion.span
              className="about-idea-line about-idea-line-horizontal"
              initial={shouldReduceMotion ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: "easeOut", delay: 0.15 }}
              aria-hidden="true"
            />
            <motion.span
              className="about-idea-line about-idea-line-vertical"
              initial={shouldReduceMotion ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: "easeOut", delay: 0.15 }}
              aria-hidden="true"
            />
            <motion.ol
              className="about-idea-flow"
              variants={pillarContainer}
              initial={initial}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              aria-label="ProcureIQ product journey"
            >
              {productJourney.map((step, index) => (
                <motion.li className="about-idea-step" variants={journeyItem} key={step.title}>
                  <span className="about-idea-node">0{index + 1}</span>
                  <h3>{t(step.title)}</h3>
                  <p>{t(step.detail)}</p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        <section className="about-v2-section about-tech-section">
          <div className="about-v2-section-heading about-tech-heading">
            <div>
              <span className="section-kicker small-kicker">
                <span className="kicker-dot">✦</span>
                TECHNOLOGY STACK
              </span>
              <h2>Modern tools. One coherent product.</h2>
            </div>
          </div>
          <div className="about-tech-grid">
            {techStack.map((technology, index) => (
              <div className="about-tech-card" key={technology}>
                <span className={`about-tech-dot about-tech-dot-${index + 1}`} aria-hidden="true" />
                <span>{technology}</span>
                <span className="about-tech-index">0{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-v2-cta">
          <div>
                <span className="about-cta-kicker">{t("aboutCtaKicker")}</span>
            <h2>{t("aboutCtaTitle")}</h2>
          </div>
          <Link to="/standards" className="primary-btn">
            {t("aboutCtaButton")} <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
