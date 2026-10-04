import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";

const recommendations = [
  { id: "IS 8112:2013", title: "Ordinary Portland Cement, 43 Grade", score: 68 },
  { id: "IS 269:2015", title: "Ordinary Portland Cement", score: 65 },
  { id: "IS 383:2016", title: "Coarse and Fine Aggregate", score: 60 }
];

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="hero-section">
      <motion.div
        className="hero-copy"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.48, ease: "easeOut" }}
      >
        <span className="section-kicker">
          <span className="kicker-dot">✦</span>
          AI-POWERED PROCUREMENT INTELLIGENCE
        </span>

        <h1>
          Find the Right <span>Indian Standard</span>.
          <br />
          Before You Procure.
        </h1>

        <p className="hero-description">
          Turn tender language into standards you can trust. ProcureIQ reads the material, application, and procurement context to surface relevant Indian Standards.
        </p>

        <div className="hero-actions">
          <Link to="/login" className="primary-btn">
            Find Standards
          </Link>
          <Link to="/standards" className="secondary-btn">
            Explore Standards
          </Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <strong>60+</strong>
            <span>Prototype Standards</span>
          </div>
          <div className="hero-stat">
            <strong>4</strong>
            <span>Categories</span>
          </div>
          <div className="hero-stat">
            <strong>AI</strong>
            <span>Semantic Matching</span>
          </div>
          <div className="hero-stat">
            <strong>PDF</strong>
            <span>Tender Analysis</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.08, ease: "easeOut" }}
      >
        <div className="visual-header">
          <span className="mini-tag">Procurement Intelligence</span>
          <span className="mini-live">LIVE MATCHING</span>
        </div>

        <div className="intel-flow">
          <motion.section
            className="intel-card intel-requirement-card"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
          >
            <div className="intel-card-heading">
              <span className="intel-step">01</span>
              <span className="intel-eyebrow">PROCUREMENT REQUIREMENT</span>
            </div>
            <p className="intel-requirement-text">“Road construction ke liye cement chahiye”</p>
          </motion.section>

          <motion.div
            className="intel-flow-connector"
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28, delay: shouldReduceMotion ? 0 : 0.42, ease: "easeOut" }}
          >
            {!shouldReduceMotion && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: [0, 0.9, 0], y: [-5, 2, 10] }}
                transition={{ duration: 0.55, delay: 0.48, ease: "easeOut" }}
              />
            )}
          </motion.div>

          <motion.section
            className="intel-card intel-analysis-card"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.42, ease: "easeOut" }}
          >
            <div className="intel-card-heading">
              <span className="intel-step">02</span>
              <span className="intel-eyebrow">SEMANTIC AI ANALYSIS</span>
              <span className="intel-pulse-dot" aria-label="Analysis active" />
            </div>
            <p className="intel-analysis-copy">Understanding material + application + context</p>
            <div className="intel-context-tags">
              <span>Material: Cement</span>
              <span>Use: Road construction</span>
            </div>
          </motion.section>

          <motion.div
            className="intel-flow-connector"
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28, delay: shouldReduceMotion ? 0 : 0.68, ease: "easeOut" }}
          >
            {!shouldReduceMotion && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: [0, 0.9, 0], y: [-5, 2, 10] }}
                transition={{ duration: 0.55, delay: 0.74, ease: "easeOut" }}
              />
            )}
          </motion.div>

          <section className="intel-results" aria-label="Recommended Indian Standards">
            <div className="intel-results-heading">
              <span className="intel-step">03</span>
              <span className="intel-eyebrow">RECOMMENDED INDIAN STANDARDS</span>
            </div>
            <div className="intel-recommendations">
              {recommendations.map((item, index) => (
                <motion.article
                  key={item.id}
                  className="intel-standard-card"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.36, delay: shouldReduceMotion ? 0 : 0.72 + index * 0.1, ease: "easeOut" }}
                  whileHover={!shouldReduceMotion ? {
                    y: -4,
                    boxShadow: "0 14px 28px rgba(16, 24, 40, 0.11)",
                    transition: { duration: 0.18, ease: "easeOut" }
                  } : undefined}
                >
                  <div className="intel-standard-info">
                    <strong>{item.id}</strong>
                    <span>{item.title}</span>
                  </div>
                  <div className="intel-match">
                    <strong>{item.score}%</strong>
                    <span>Match</span>
                  </div>
                  <div className="intel-match-track" aria-label={`${item.score}% match`}>
                    <motion.span
                      className="intel-match-fill"
                      initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay: shouldReduceMotion ? 0 : 0.82 + index * 0.1, ease: "easeOut" }}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </main>
  );
}
