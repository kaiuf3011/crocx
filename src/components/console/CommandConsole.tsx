import { useEffect, useState, useRef, useCallback } from 'react';
import { useSimulatedTelemetry } from '../../hooks/useSimulatedTelemetry';
import type { FaultType, TrendDeviation } from '../../hooks/useSimulatedTelemetry';
import { MapPin, Wrench, Bell, X, Flame, Battery, AlertTriangle, Droplet, Clock } from 'lucide-react';
import RiskDial from './RiskDial';
import PredictiveCountdown from './PredictiveCountdown';
import SensorGrid from './SensorGrid';
import CorrelationDrift from './CorrelationDrift';
import FailurePropagation from './FailurePropagation';
import ExplainabilityPanel from './ExplainabilityPanel';
import RuleEnginePanel from './RuleEnginePanel';
import AIEnginePanel from './AIEnginePanel';
import PriorityEngine from './PriorityEngine';
import DigitalTwin3D from './DigitalTwin3D';
import TrendDeviationPanel from './TrendDeviation';
import RiskContributionBar from './RiskContribution';
import IncidentTimeline from './IncidentTimeline';
import RecommendedActions from './RecommendedActions';
import HistoryPanel from './HistoryPanel';
import EmergencyAlert from './EmergencyAlert';
import './CommandConsole.css';

const FAULT_OPTIONS: { type: FaultType; label: string; icon: React.ReactNode }[] = [
    { type: 'engine_overheat', label: 'Engine Overheat', icon: <Flame size={14} /> },
    { type: 'battery_fault', label: 'Battery Fault', icon: <Battery size={14} /> },
    { type: 'tire_pressure', label: 'Tire Pressure', icon: <AlertTriangle size={14} /> },
    { type: 'oil_pressure', label: 'Oil Pressure', icon: <Droplet size={14} /> },
];

/* -------------------------------------------------------
   Notification Toast
   ------------------------------------------------------- */
interface ToastNotification {
    id: number;
    message: string;
    detail: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
}

function NotificationToast({ toast, onDismiss }: { toast: ToastNotification; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`cc-toast cc-toast--${toast.severity}`}>
            <div className="cc-toast__icon"><AlertTriangle size={14} /></div>
            <div className="cc-toast__body">
                <div className="cc-toast__msg">{toast.message}</div>
                <div className="cc-toast__detail">{toast.detail}</div>
            </div>
            <button className="cc-toast__close" onClick={() => onDismiss(toast.id)}>
                <X size={12} />
            </button>
        </div>
    );
}

/* -------------------------------------------------------
   Service Modal
   ------------------------------------------------------- */
function ServiceModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="cc-modal-overlay" onClick={onClose}>
            <div className="cc-modal" onClick={e => e.stopPropagation()}>
                <div className="cc-modal__header">
                    <Wrench size={18} />
                    <span>Service Ticket Generated</span>
                </div>
                <div className="cc-modal__body">
                    <p>Inspection request submitted to the nearest certified service center.</p>
                    <p className="cc-modal__ref">Reference: <strong>CRX-{Date.now().toString(36).toUpperCase()}</strong></p>
                </div>
                <button className="cc-modal__btn" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default function CommandConsole() {
    const {
        sensors, risk, drifts, propagation, explanations,
        mode, setMode,
        activeFaults, injectFault, clearAllFaults,
        ruleState, aiState, priorityState,
        trendDeviations,
        // Predictive Intelligence
        slopeTTC, baselines, riskContributions,
        incidentLog, recommendations,
        // History
        history, clearHistory,
    } = useSimulatedTelemetry();

    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const lastToastRef = useRef<Set<string>>(new Set());
    let toastIdRef = useRef(0);

    // Track mouse for ambient parallax layer
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate toasts from high-severity trend deviations
    useEffect(() => {
        const highDevs = trendDeviations.filter((d: TrendDeviation) => d.severity === 'high');
        highDevs.forEach(d => {
            if (!lastToastRef.current.has(d.sensorId)) {
                lastToastRef.current.add(d.sensorId);
                const id = ++toastIdRef.current;
                setToasts(prev => [...prev.slice(-2), {
                    id,
                    message: `${d.sensorLabel} ${d.direction} abnormally`,
                    detail: `Rate: ${d.multiplier}× baseline — AI Confidence: ${aiState.confidence}`,
                    severity: d.severity,
                    timestamp: Date.now(),
                }]);
                setNotifCount(c => c + 1);
            }
        });
        // Clear stale sensor IDs
        const activeIds = new Set(highDevs.map(d => d.sensorId));
        lastToastRef.current.forEach(id => {
            if (!activeIds.has(id)) lastToastRef.current.delete(id);
        });
    }, [trendDeviations, aiState.confidence]);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const handleLocateRepair = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    window.open(
                        `https://www.google.com/maps/search/car+repair/@${pos.coords.latitude},${pos.coords.longitude},15z`,
                        '_blank'
                    );
                },
                () => {
                    window.open('https://www.google.com/maps/search/auto+repair+near+me', '_blank');
                }
            );
        } else {
            window.open('https://www.google.com/maps/search/auto+repair+near+me', '_blank');
        }
    };

    const isIncident = risk.status === 'critical';
    const [showHistory, setShowHistory] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const prevRiskStatusRef = useRef(risk.status);

    // Auto-trigger emergency alert on first critical transition
    useEffect(() => {
        if (risk.status === 'critical' && prevRiskStatusRef.current !== 'critical') {
            setShowEmergency(true);
        }
        prevRiskStatusRef.current = risk.status;
    }, [risk.status]);

    return (
        <div
            className={`cc ${isIncident ? 'cc--incident' : ''}`}
            ref={containerRef}
            style={{
                '--mouse-x': `${mousePos.x}%`,
                '--mouse-y': `${mousePos.y}%`
            } as React.CSSProperties}
        >
            {/* Ambient Mouse Tracking Reflection */}
            <div className="cc-ambient-reflection" />

            {/* Incident Overlay */}
            {isIncident && <div className="cc-incident-overlay" />}

            {/* Toast Notifications */}
            <div className="cc-toast-container">
                {toasts.map(t => (
                    <NotificationToast key={t.id} toast={t} onDismiss={dismissToast} />
                ))}
            </div>

            {/* Console Header */}
            <header className={`cc-header ${isIncident ? 'cc-header--incident' : ''}`}>
                <div className="cc-header__left">
                    <span className="cc-logo">◆</span>
                    <span className="cc-title">CrocX Command Console</span>
                </div>

                {/* Mode Toggle + Fault Injection */}
                <div className="cc-header__center">
                    <div className="cc-mode-toggle">
                        <button
                            className={`cc-mode-btn ${mode === 'simulated' ? 'active' : ''}`}
                            onClick={() => setMode('simulated')}
                        >
                            Simulated
                        </button>
                        <button
                            className={`cc-mode-btn ${mode === 'live' ? 'active' : ''}`}
                            onClick={() => setMode('live')}
                        >
                            Live
                        </button>
                    </div>
                    <div className="cc-fault-controls">
                        {FAULT_OPTIONS.map(opt => {
                            const isActive = activeFaults.some(f => f.type === opt.type);
                            return (
                                <button
                                    key={opt.type}
                                    className={`cc-fault-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => injectFault(opt.type)}
                                    title={`Inject ${opt.label}`}
                                    disabled={isActive}
                                >
                                    <span>{opt.icon}</span>
                                    <span className="cc-fault-btn__label">{opt.label}</span>
                                </button>
                            );
                        })}
                        {activeFaults.length > 0 && (
                            <button className="cc-fault-btn cc-fault-btn--clear" onClick={clearAllFaults}>
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="cc-header__right">
                    {/* History Button */}
                    <button className="cc-history-btn" onClick={() => setShowHistory(true)}>
                        <Clock size={14} />
                        <span>History</span>
                    </button>
                    {/* Notification Bell */}
                    <div className="cc-notif-bell">
                        <Bell size={16} />
                        {notifCount > 0 && <span className="cc-notif-badge">{notifCount}</span>}
                    </div>
                    <span className="cc-status-dot" data-status={risk.status} />
                    <span className="cc-status-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isIncident && <AlertTriangle size={14} />}
                        {isIncident ? 'INCIDENT ACTIVE' : risk.status.toUpperCase()}
                    </span>
                </div>
            </header>

            {/* Main Grid */}
            <main className="cc-grid">
                {/* Left Column — Risk + Countdown + Actions + 3D Twin */}
                <div className="cc-left">
                    <div className="cc-panel cc-glass-a cc-panel--risk">
                        <RiskDial risk={risk} mousePos={mousePos} />
                    </div>
                    <div className="cc-panel cc-glass-b cc-panel--risk-contrib">
                        <RiskContributionBar contributions={riskContributions} riskScore={risk.score} />
                    </div>
                    <div className="cc-panel cc-glass-b cc-panel--countdown">
                        <PredictiveCountdown timeToCritical={risk.timeToCritical} riskScore={risk.score} slopeTTC={slopeTTC} />
                    </div>

                    {/* Action Buttons */}
                    <div className="cc-action-row">
                        <button className="cc-action-btn cc-action-btn--locate" onClick={handleLocateRepair}>
                            <MapPin size={14} />
                            <span>Locate Repair Center</span>
                        </button>
                        <button
                            className={`cc-action-btn cc-action-btn--service ${isIncident ? 'cc-action-btn--critical' : ''}`}
                            onClick={() => setShowServiceModal(true)}
                        >
                            <Wrench size={14} />
                            <span>Schedule Inspection</span>
                        </button>
                    </div>

                    <div className="cc-panel cc-glass-b cc-panel--twin">
                        <h2 className="panel-title">Digital Twin</h2>
                        <DigitalTwin3D sensors={sensors} activeFaults={activeFaults} />
                    </div>
                </div>

                {/* Right Column — Sensors + Intelligence Panels + Bottom */}
                <div className="cc-right">
                    <div className="cc-panel cc-glass-a cc-panel--sensors">
                        <h2 className="panel-title">Behavioral Monitoring</h2>
                        <SensorGrid sensors={sensors} baselines={baselines} />
                    </div>

                    {/* Intelligence Row — Rule + AI + Priority */}
                    <div className="cc-intel-grid">
                        <div className="cc-panel cc-glass-b cc-panel--rule">
                            <RuleEnginePanel ruleState={ruleState} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--ai">
                            <AIEnginePanel aiState={aiState} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--priority">
                            <PriorityEngine priorityState={priorityState} />
                        </div>
                    </div>

                    {/* Compact 2×3 Intelligence Grid */}
                    <div className="cc-bottom-grid">
                        <div className="cc-panel cc-glass-b cc-panel--drift cc-panel--compact">
                            <CorrelationDrift drifts={drifts} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--propagation cc-panel--compact">
                            <FailurePropagation nodes={propagation} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--trend cc-panel--compact">
                            <TrendDeviationPanel deviations={trendDeviations} />
                        </div>
                        <div className="cc-panel cc-glass-c cc-panel--explain cc-panel--compact">
                            <ExplainabilityPanel entries={explanations} riskScore={risk.score} timeToCritical={risk.timeToCritical} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--timeline cc-panel--compact">
                            <IncidentTimeline events={incidentLog} />
                        </div>
                        <div className="cc-panel cc-glass-b cc-panel--rec-actions cc-panel--compact">
                            <RecommendedActions recommendations={recommendations} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Service Modal */}
            {showServiceModal && <ServiceModal onClose={() => setShowServiceModal(false)} />}

            {/* History Panel */}
            {showHistory && (
                <HistoryPanel
                    history={history}
                    onClose={() => setShowHistory(false)}
                    onClear={clearHistory}
                />
            )}

            {/* Emergency Alert — Auto-triggered on critical */}
            <EmergencyAlert
                isVisible={showEmergency}
                riskScore={risk.score}
                onDismiss={() => setShowEmergency(false)}
            />
        </div>
    );
}
