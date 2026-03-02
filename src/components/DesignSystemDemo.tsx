import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Zap, Shield, Activity, ArrowRight, Layers, Cpu, Database, BarChart3, Lock, Globe, Search, Brain, Eye, AlertTriangle, TrendingUp, Factory, Truck, Car, Flame, Battery } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './DesignSystemDemo.css';

/* =========================================================
   Real Porsche 911 3D Model (Hero & Twin sections)
   Each instance clones the scene so multiple Canvases work.
   ========================================================= */
function HeroCar() {
    const { scene } = useGLTF('/porsche-opt.glb');
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    return (
        <group rotation={[0, Math.PI * 0.75, 0]}>
            <primitive object={clonedScene} scale={1} position={[0, 0, 0]} />
        </group>
    );
}

useGLTF.preload('/porsche-opt.glb');

/* =========================================================
   "How CrocX Thinks" Pipeline Step
   ========================================================= */
const PIPELINE_STEPS = [
    { icon: <Search size={20} />, label: 'Monitor', desc: 'Continuous multi-sensor behavioral telemetry ingestion' },
    { icon: <Brain size={20} />, label: 'Detect', desc: 'Rule-based safety logic + AI anomaly detection' },
    { icon: <Layers size={20} />, label: 'Correlate', desc: 'Cross-system correlation drift analysis' },
    { icon: <TrendingUp size={20} />, label: 'Escalate', desc: 'Weighted priority scoring with persistence tracking' },
    { icon: <Eye size={20} />, label: 'Visualize', desc: '3D digital twin fault localization + explainability' },
];

export default function DesignSystemDemo() {
    const { theme, toggleTheme } = useTheme();
    const archRef = useRef<HTMLDivElement>(null);
    const [archAnimated, setArchAnimated] = useState(false);
    const pipelineRef = useRef<HTMLDivElement>(null);
    const [pipelineAnimated, setPipelineAnimated] = useState(false);

    // Intersection Observer for architecture diagram sweep animation
    useEffect(() => {
        const el = archRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !archAnimated) {
                    setArchAnimated(true);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [archAnimated]);

    // Intersection Observer for pipeline animation
    useEffect(() => {
        const el = pipelineRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !pipelineAnimated) {
                    setPipelineAnimated(true);
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [pipelineAnimated]);

    return (
        <div className="demo-page">
            {/* Navbar */}
            <nav className="demo-navbar">
                <div className="container demo-navbar-inner">
                    <div className="demo-logo">
                        <span className="demo-logo-icon">◆</span>
                        <span className="demo-logo-text">CrocX</span>
                    </div>
                    <div className="demo-nav-actions">
                        <Link to="/architecture" className="nav-link" id="nav-architecture">
                            Architecture
                        </Link>
                        <button
                            className="demo-theme-toggle"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            id="theme-toggle"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/login" className="btn btn-primary" id="cta-demo">
                            Operator Login
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ============================================
                HERO — "See Failures Before They Happen"
               ============================================ */}
            <section className="demo-hero">
                {/* 3D Car — Background layer */}
                <div className="hero-3d-bg">
                    <Canvas
                        camera={{ position: [5, 1.8, 5], fov: 36 }}
                        style={{ background: 'transparent', width: '100%', height: '100%' }}
                        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                        dpr={[1, 1.5]}
                        frameloop="demand"
                    >
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[5, 5, 5]} intensity={0.7} />
                        <directionalLight position={[-3, 2, -3]} intensity={0.3} color="#AF924D" />
                        <Suspense fallback={null}>
                            <HeroCar />
                        </Suspense>
                        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
                    </Canvas>
                </div>

                {/* Text content — on top */}
                <div className="container demo-hero-content">
                    <span className="section-label">
                        <Zap size={12} />
                        Predictive Vehicle Intelligence
                    </span>
                    <h1 className="demo-hero-headline">
                        Predict Mechanical Failures<br />
                        <span className="accent-underline">Before They Cascade.</span>
                    </h1>
                    <p className="demo-hero-sub">
                        CrocX combines rule-based safety logic, anomaly detection, and digital twin visualization
                        to detect cross-sensor failure patterns in real time.
                    </p>
                    <div className="demo-hero-actions">
                        <Link to="/login" className="btn btn-primary btn-hero">
                            Launch Command Console
                            <ArrowRight size={14} />
                        </Link>
                        <Link to="/architecture" className="btn btn-ghost">
                            View Architecture
                        </Link>
                    </div>
                    <div className="hero-glow demo-hero-glow" />
                </div>
            </section>

            <hr className="divider" />

            {/* ============================================
                HYBRID INTELLIGENCE ENGINE
               ============================================ */}
            <section className="demo-section section-alt section-divider" id="hybrid-engine">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Hybrid Intelligence</span>
                        <h2>Deterministic Logic + Probabilistic AI</h2>
                        <p>Two complementary intelligence systems working in concert for reliable failure prediction.</p>
                    </div>
                    <div className="demo-ps-grid">
                        <div className="demo-ps-col card">
                            <h4><Shield size={18} /> Rule-Based Engine</h4>
                            <ul>
                                <li>Threshold validation against safety limits</li>
                                <li>Safety severity mapping (1–10 scale)</li>
                                <li>Duration-based persistence tracking</li>
                                <li>Deterministic trigger activation</li>
                            </ul>
                        </div>
                        <div className="demo-ps-col card card-glow">
                            <h4><Brain size={18} /> AI Anomaly Detection</h4>
                            <ul>
                                <li>Isolation Forest behavioral modeling</li>
                                <li>Feature normalization (StandardScaler)</li>
                                <li>Behavioral deviation scoring</li>
                                <li>Continuous anomaly risk (0–10 scale)</li>
                            </ul>
                        </div>
                    </div>
                    {/* Formula */}
                    <div className="formula-block">
                        <div className="formula-label">Weighted Priority Score</div>
                        <div className="formula-equation">
                            <span className="formula-part">Priority</span>
                            <span className="formula-op">=</span>
                            <span className="formula-part">(0.6 × <em>Rule Score</em>)</span>
                            <span className="formula-op">+</span>
                            <span className="formula-part">(0.4 × <em>AI Risk</em>)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                3D DIGITAL TWIN
               ============================================ */}
            <section className="demo-section section-divider" id="digital-twin">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Digital Twin</span>
                        <h2>Interactive Digital Twin Visualization</h2>
                        <p>Instead of abstract alerts, CrocX visualizes fault localization in a real-time digital twin, improving clarity and reducing response time.</p>
                    </div>
                    <div className="twin-demo-grid">
                        <div className="twin-demo-visual twin-demo-visual--static">
                            <div className="twin-static-display">
                                <div className="twin-static-icon">◆</div>
                                <div className="twin-static-label">3D Digital Twin</div>
                                <div className="twin-static-desc">Real-time interactive vehicle model with subsystem fault highlighting</div>
                                <div className="twin-static-badges">
                                    <span className="twin-static-badge">Engine</span>
                                    <span className="twin-static-badge">Battery</span>
                                    <span className="twin-static-badge">Tires</span>
                                    <span className="twin-static-badge">Cooling</span>
                                    <span className="twin-static-badge">Trans</span>
                                    <span className="twin-static-badge">Oil</span>
                                </div>
                            </div>
                        </div>
                        <div className="twin-demo-features">
                            <div className="twin-feature">
                                <span className="twin-feature__icon"><Car size={18} /></span>
                                <div><strong>3D Vehicle Model</strong><br />Real-time interactive visualization</div>
                            </div>
                            <div className="twin-feature">
                                <span className="twin-feature__icon"><Flame size={18} /></span>
                                <div><strong>Engine Glow</strong><br />Glows gold → red when overheating</div>
                            </div>
                            <div className="twin-feature">
                                <span className="twin-feature__icon"><AlertTriangle size={18} /></span>
                                <div><strong>Tire Pressure</strong><br />Individual tire highlight on anomaly</div>
                            </div>
                            <div className="twin-feature">
                                <span className="twin-feature__icon"><Battery size={18} /></span>
                                <div><strong>Battery Fault</strong><br />Battery pack pulse glow on detection</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                EXPLAINABLE RISK INTELLIGENCE
               ============================================ */}
            <section className="demo-section section-alt section-divider" id="explainability">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Explainability</span>
                        <h2>Explainable Risk Intelligence</h2>
                        <p>CrocX doesn't just detect anomalies — it explains them, combining cross-sensor reasoning and correlation drift analysis.</p>
                    </div>
                    <div className="explain-demo-block">
                        <div className="explain-demo-alert">
                            <AlertTriangle size={20} />
                            <div>
                                <strong>High anomaly risk</strong> due to abnormal engine temperature trend and RPM variance.
                                Cross-sensor correlation between <em>Engine Temp</em> and <em>Coolant Flow</em> has drifted
                                by 23% from baseline, indicating potential cooling system degradation.
                            </div>
                        </div>
                        <div className="explain-demo-meta">
                            <div className="explain-demo-stat">
                                <span className="explain-demo-stat__value">7.8</span>
                                <span className="explain-demo-stat__label">Risk Score</span>
                            </div>
                            <div className="explain-demo-stat">
                                <span className="explain-demo-stat__value">3</span>
                                <span className="explain-demo-stat__label">Contributing Factors</span>
                            </div>
                            <div className="explain-demo-stat">
                                <span className="explain-demo-stat__value">23%</span>
                                <span className="explain-demo-stat__label">Correlation Drift</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                HOW CROCX THINKS — 5-Step Pipeline
               ============================================ */}
            <section className="demo-section section-divider" id="how-it-thinks">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Intelligence Pipeline</span>
                        <h2>How CrocX Thinks</h2>
                        <p>From raw sensor data to actionable prediction in under 100 milliseconds.</p>
                    </div>
                    <div
                        className={`pipeline-row ${pipelineAnimated ? 'animate' : ''}`}
                        ref={pipelineRef}
                    >
                        {PIPELINE_STEPS.map((step, i) => (
                            <div className="pipeline-step" key={step.label} style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="pipeline-step__icon">{step.icon}</div>
                                <div className="pipeline-step__num">{i + 1}</div>
                                <div className="pipeline-step__label">{step.label}</div>
                                <div className="pipeline-step__desc">{step.desc}</div>
                                {i < PIPELINE_STEPS.length - 1 && <div className="pipeline-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
                INDUSTRY ALIGNMENT
               ============================================ */}
            <section className="demo-section section-alt section-divider" id="industry-alignment">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Research Lineage</span>
                        <h2>Aligned With Industry-Grade Diagnostic Research</h2>
                        <p>CrocX builds upon established methodologies in automotive condition monitoring and predictive diagnostics.</p>
                    </div>

                    <div className="industry-grid">
                        <div className="industry-foundations">
                            <h3>Industry Foundations</h3>
                            <ul className="industry-list">
                                <li>
                                    <span className="industry-dot" />
                                    <span>Continuous vehicle condition monitoring systems</span>
                                </li>
                                <li>
                                    <span className="industry-dot" />
                                    <span>Predictive diagnostic modeling frameworks</span>
                                </li>
                                <li>
                                    <span className="industry-dot" />
                                    <span>Pattern-recognition-based anomaly detection</span>
                                </li>
                                <li>
                                    <span className="industry-dot" />
                                    <span>Supervisory system diagnostics architecture</span>
                                </li>
                                <li>
                                    <span className="industry-dot" />
                                    <span>Predictive failure alerting methodologies</span>
                                </li>
                            </ul>
                            <p className="industry-note">
                                CrocX extends these established concepts with behavior-driven digital twin modeling
                                and cross-sensor correlation drift analysis.
                            </p>
                        </div>

                        <div className="industry-diff">
                            <h3>How CrocX Differs</h3>
                            <div className="diff-comparison">
                                <div className="diff-col diff-col--legacy">
                                    <div className="diff-col__header">Traditional Systems</div>
                                    <ul>
                                        <li>Threshold-based alerts</li>
                                        <li>Isolated component monitoring</li>
                                        <li>Limited explainability</li>
                                        <li>Reactive maintenance</li>
                                    </ul>
                                </div>
                                <div className="diff-col diff-col--crocx">
                                    <div className="diff-col__header">CrocX Approach</div>
                                    <ul>
                                        <li>Hybrid rule + AI anomaly scoring</li>
                                        <li>Correlation-driven risk escalation</li>
                                        <li>Failure propagation modeling</li>
                                        <li>Real-time digital twin visualization</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                CAPABILITIES
               ============================================ */}
            <section className="demo-section section-divider" id="benefits">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Capabilities</span>
                        <h2>Engineered for Precision</h2>
                        <p>Every layer is designed for accuracy, speed, and intelligent response.</p>
                    </div>
                    <div className="demo-benefit-grid">
                        {[
                            { icon: <Zap size={22} />, title: 'Predictive Engine', desc: 'Real-time failure probability scoring with weighted rule + AI fusion.' },
                            { icon: <Shield size={22} />, title: 'Digital Twin', desc: 'Full vehicle simulation with subsystem-level fault visualization.' },
                            { icon: <Activity size={22} />, title: 'Live Telemetry', desc: 'Sub-millisecond sensor data ingestion across 200+ telemetry channels.' },
                            { icon: <Layers size={22} />, title: 'Cross-System Intel', desc: 'Correlate failures across powertrain, chassis, and electrical domains.' },
                            { icon: <Lock size={22} />, title: 'Secure Storage', desc: 'End-to-end encrypted data pipeline with SOC 2 Type II compliance.' },
                            { icon: <Globe size={22} />, title: 'Fleet-Wide Scale', desc: 'Deploy across 100,000+ vehicles with edge-to-cloud architecture.' },
                        ].map((item, i) => (
                            <div className="card card-glow demo-benefit-card" key={i}>
                                <div className="demo-card-icon">{item.icon}</div>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
                ARCHITECTURE DIAGRAM
               ============================================ */}
            <section className="demo-section section-divider" id="architecture">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">System Architecture</span>
                        <h2>Intelligence Pipeline</h2>
                        <p>From sensor to prediction in under 100 milliseconds.</p>
                    </div>
                    <div
                        className={`arch-pipeline demo-arch-row ${archAnimated ? 'animate' : ''}`}
                        ref={archRef}
                    >
                        {['Sensors', 'Edge', 'Gateway', 'AI Engine', 'Model', 'Dashboard'].map((node, i) => (
                            <div className="demo-arch-step" key={node}>
                                <div className={`arch-node ${archAnimated ? 'active' : ''}`}>
                                    <div className="demo-arch-icon">
                                        {i === 0 && <Activity size={16} />}
                                        {i === 1 && <Cpu size={16} />}
                                        {i === 2 && <Layers size={16} />}
                                        {i === 3 && <Zap size={16} />}
                                        {i === 4 && <Database size={16} />}
                                        {i === 5 && <BarChart3 size={16} />}
                                    </div>
                                    {node}
                                </div>
                                {i < 5 && <div className="arch-connector" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================
                BUILT FOR — Target Audience
               ============================================ */}
            <section className="demo-section section-divider" id="built-for">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Built For</span>
                        <h2>Who Uses CrocX</h2>
                        <p>Purpose-built for teams that can't afford reactive maintenance.</p>
                    </div>
                    <div className="audience-grid">
                        <div className="audience-card">
                            <div className="audience-card__icon"><Factory size={28} /></div>
                            <h3>EV Startups</h3>
                            <p>Ship vehicles with built-in predictive intelligence. Reduce warranty claims by detecting behavioral anomalies before delivery.</p>
                        </div>
                        <div className="audience-card">
                            <div className="audience-card__icon"><Cpu size={28} /></div>
                            <h3>Automotive R&D</h3>
                            <p>Accelerate validation cycles with real-time cross-sensor correlation and digital twin failure simulation.</p>
                        </div>
                        <div className="audience-card">
                            <div className="audience-card__icon"><Truck size={28} /></div>
                            <h3>Fleet Operators</h3>
                            <p>Prevent roadside breakdowns with predictive maintenance scoring across your entire fleet — from one console.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================
                FINAL CTA + Positioning Statement
               ============================================ */}
            <section className="section-cta" id="final-cta">
                <div className="container">
                    <span className="section-label">Get Started</span>
                    <h2 style={{ marginTop: 'var(--space-md)' }}>Stop Reacting. Start Predicting.</h2>
                    <p className="cta-positioning">
                        CrocX is a behavior-driven digital twin platform that combines deterministic safety rules,
                        AI-based anomaly detection, and cross-sensor intelligence to predict cascading mechanical
                        failures — before they reach your customers.
                    </p>
                    <Link to="/login" className="btn btn-primary btn-lg">
                        Launch Command Console
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="demo-footer">
                <div className="container demo-footer-inner">
                    <div className="demo-footer-left">
                        <span className="demo-logo-icon">◆</span>
                        <span className="demo-logo-text" style={{ fontSize: 'var(--font-size-sm)' }}>CrocX</span>
                    </div>
                    <span className="footer-research-badge">Research-Inspired Architecture</span>
                    <p>© 2026 CrocX Intelligence — All rights reserved</p>
                </div>
            </footer>
        </div>
    );
}
