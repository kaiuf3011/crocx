import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, ArrowLeft, Database, Shield, Brain, Layers, Eye, Box } from 'lucide-react';
import './Architecture.css';

const PIPELINE = [
    {
        id: 'telemetry',
        icon: <Database size={20} />,
        title: 'Telemetry Stream',
        desc: 'Simulated or device-sourced sensor data ingested at 400ms intervals. 8 channels covering engine temp, oil pressure, battery voltage, vibration, coolant flow, exhaust temp, and transmission temp.',
        tech: 'Supabase Realtime · WebSocket · React State',
    },
    {
        id: 'rules',
        icon: <Shield size={20} />,
        title: 'Rule Engine',
        desc: 'Deterministic threshold validation with severity mapping and duration tracking. 8 predefined safety rules evaluate sensor readings against critical boundaries.',
        tech: 'TypeScript · Threshold Logic · Duration Counters',
    },
    {
        id: 'ai',
        icon: <Brain size={20} />,
        title: 'AI Anomaly Model',
        desc: 'Isolation Forest–inspired anomaly scoring on normalized telemetry data. Computes anomaly decision function, maps to 0–10 risk score, and identifies contributing features.',
        tech: 'Isolation Forest · Feature Normalization · Anomaly Decision Function',
    },
    {
        id: 'priority',
        icon: <Layers size={20} />,
        title: 'Priority Engine',
        desc: 'Weighted fusion of deterministic and probabilistic signals. Final priority = (0.6 × Rule Score) + (0.4 × AI Risk). Outputs unified severity status and escalation level.',
        tech: 'Weighted Scoring · Status Classification · Escalation Logic',
        code: 'Priority = (0.6 × Rule Score) + (0.4 × AI Risk)',
    },
    {
        id: 'twin',
        icon: <Box size={20} />,
        title: 'Digital Twin',
        desc: 'Real-time 3D vehicle visualization with subsystem-level fault mapping. Engine, battery, tires, cooling, transmission, and oil system rendered with severity-driven emissive glow.',
        tech: 'React Three Fiber · GLB Model · Fault Mapping JSON',
    },
    {
        id: 'explain',
        icon: <Eye size={20} />,
        title: 'Explainability Layer',
        desc: 'Human-readable risk reasoning combining cross-sensor correlation drift, contribution analysis, and trend deviation detection. Shows why the system flagged a risk, not just that it did.',
        tech: 'Correlation Analysis · Drift Duration · Natural Language Generation',
    },
];

export default function Architecture() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="arch-page" data-theme={theme}>
            <nav className="arch-nav">
                <div className="container arch-nav-inner">
                    <Link to="/" className="arch-back">
                        <ArrowLeft size={16} />
                        <span className="arch-logo-icon">◆</span>
                        <span className="arch-logo-text">CrocX</span>
                    </Link>
                    <div className="arch-nav-actions">
                        <button className="arch-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/console" className="btn btn-primary btn-sm">
                            Open Console
                        </Link>
                    </div>
                </div>
            </nav>

            <header className="arch-header">
                <div className="container">
                    <span className="section-label">Portfolio · Technical Breakdown</span>
                    <h1>System Architecture</h1>
                    <p className="arch-header-sub">
                        CrocX is a behavior-driven vehicle digital twin that combines deterministic safety rules
                        and probabilistic anomaly detection to predict cascading mechanical failures in real time.
                    </p>
                </div>
            </header>

            <main className="container arch-main">
                <div className="arch-pipeline">
                    {PIPELINE.map((step, i) => (
                        <div className="arch-step" key={step.id}>
                            <div className="arch-step__connector-area">
                                <div className="arch-step__number">{i + 1}</div>
                                {i < PIPELINE.length - 1 && <div className="arch-step__line" />}
                            </div>
                            <div className="arch-step__card">
                                <div className="arch-step__icon">{step.icon}</div>
                                <div className="arch-step__content">
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                    <div className="arch-step__tech">{step.tech}</div>
                                    {step.code && (
                                        <code className="arch-step__code">{step.code}</code>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Key Differentiators */}
                <section className="arch-differentiators">
                    <h2>Key Differentiators</h2>
                    <div className="arch-diff-grid">
                        <div className="arch-diff-card">
                            <h4>Cross-Sensor Behavior</h4>
                            <p>Detects anomalies that single-sensor thresholds miss by analyzing multi-dimensional telemetry correlations.</p>
                        </div>
                        <div className="arch-diff-card">
                            <h4>Cascading Failure Prediction</h4>
                            <p>Maps fault propagation paths across subsystems — engine → cooling → electrical → transmission — before downstream failures occur.</p>
                        </div>
                        <div className="arch-diff-card">
                            <h4>Explainable Risk</h4>
                            <p>Every risk score comes with human-readable reasoning: which sensors contributed, drift duration, and correlation deviation percentage.</p>
                        </div>
                        <div className="arch-diff-card">
                            <h4>Hybrid Intelligence</h4>
                            <p>Deterministic rules for known thresholds + probabilistic AI for behavioral anomalies. Weighted fusion ensures both precision and coverage.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="arch-footer">
                <div className="container">
                    <p>◆ CrocX Intelligence — System Architecture v1.0</p>
                </div>
            </footer>
        </div>
    );
}
