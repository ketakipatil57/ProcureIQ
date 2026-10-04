import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import Navbar from "../components/Navbar";
import NetworkBackground from "../components/NetworkBackground";

const pillars = [
  {
    icon: "Aa",
    title: "Semantic Understanding",
    description: "Reads intent and context beyond exact keyword matches."
  },
  {
    icon: "文",
    title: "Multilingual Input",
    description: "Understands local-language phrasing and mixed-language queries."
  },
  {
    icon: "IS",
    title: "Standards Intelligence",
    description: "Connects procurement needs to relevant Indian Standards."
  },
  {
    icon: "✓",
    title: "Compliance Awareness",
    description: "Surfaces certification and compliance context early."
  }
];

const productJourney = [
  { title: "Procurement Requirement", detail: "Tender or brief" },
  { title: "AI Understanding", detail: "Material, intent, context" },
  { title: "Relevant Standards", detail: "Context-aware matches" },
  { title: "Structured Intelligence", detail: "Connected information" },
  { title: "Better Procurement Workflow", detail: "Clearer decisions" }
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
              ABOUT PROCUREIQ
            </span>
            <h1>Making Indian Standards easier to discover.</h1>
            <p>
              ProcureIQ brings semantic AI and structured standards intelligence into the procurement workflow.
            </p>
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
                FOUR CORE PILLARS
              </span>
              <h2>Standards discovery, made more intelligent.</h2>
            </div>
            <p>Purpose-built capabilities help move from everyday language to structured procurement insight.</p>
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
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section className="about-v2-section about-idea-section">
          <div className="about-v2-section-heading about-idea-heading">
            <div>
              <span className="section-kicker small-kicker">
                <span className="kicker-dot">✦</span>
                THE PRODUCT IDEA
              </span>
              <h2>From a requirement to a better workflow.</h2>
            </div>
            <p>Each step adds useful context, connecting the initial need to actionable standards intelligence.</p>
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
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
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
            <span className="about-cta-kicker">DISCOVER WHAT APPLIES</span>
            <h2>Find the standards behind better procurement.</h2>
          </div>
          <Link to="/standards" className="primary-btn">
            Explore the Standards Library <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}