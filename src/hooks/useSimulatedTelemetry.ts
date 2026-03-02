import { useState, useEffect, useRef, useCallback } from 'react';

/* =========================================================
   Types
   ========================================================= */
export interface SensorReading {
    id: string;
    label: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    nominal: number;
    status: 'nominal' | 'warning' | 'critical';
    trend: number[];
}

export interface RiskState {
    score: number;
    persistence: number;
    anomalyPct: number;
    status: 'nominal' | 'elevated' | 'warning' | 'critical';
    timeToCritical: number;
}

export interface DriftEvent {
    sensorA: string;
    sensorB: string;
    correlation: number;
    drift: number;
    active: boolean;
}

export interface PropagationNode {
    id: string;
    label: string;
    active: boolean;
    severity: number;
}

export interface ExplainabilityEntry {
    sensor: string;
    contribution: number;
    driftDuration: number;
    reason: string;
}

/* =========================================================
   NEW — Rule Engine, AI Engine, Priority Engine Types
   ========================================================= */
export interface RuleEngineState {
    triggeredRules: TriggeredRule[];
    totalSeverity: number;
}

export interface TriggeredRule {
    sensor: string;
    condition: string;
    severity: number;    // 1–10
    duration: number;    // seconds active
}

export interface AIEngineState {
    anomalyScore: number;   // 0–1 raw isolation forest output (simulated)
    riskScore: number;      // 0–10 normalized
    confidence: 'Low' | 'Medium' | 'High';
    features: string[];     // contributing features
}

export interface PriorityState {
    ruleScore: number;      // 0–10
    aiRisk: number;         // 0–10
    finalPriority: number;  // weighted combination
    status: 'nominal' | 'elevated' | 'warning' | 'critical';
}

export type FaultType = 'engine_overheat' | 'battery_fault' | 'tire_pressure' | 'oil_pressure';
export type TelemetryMode = 'simulated' | 'live';

/* =========================================================
   Trend Deviation — Behavior Shift Detection
   ========================================================= */
export interface TrendDeviation {
    sensorId: string;
    sensorLabel: string;
    direction: 'rising' | 'falling';
    multiplier: number;      // e.g. 2.3x
    message: string;          // human-readable
    severity: 'low' | 'medium' | 'high';
}

/* =========================================================
   Active Faults Tracking
   ========================================================= */
export interface ActiveFault {
    type: FaultType;
    label: string;
    startedAt: number;       // timestamp
    intensity: number;       // 0–1, ramps up
}

/* =========================================================
   Slope-based Time-to-Critical
   ========================================================= */
export interface SlopeTTC {
    sensorId: string;
    sensorLabel: string;
    rate: number;            // units per minute
    unit: string;
    estimatedSeconds: number;
    threshold: number;
    current: number;
}

/* =========================================================
   Adaptive Baselines (σ notation)
   ========================================================= */
export interface SensorBaseline {
    sensorId: string;
    mean: number;
    stdDev: number;
    sigmaDeviation: number;  // how many σ away from mean
}

/* =========================================================
   Risk Contribution Breakdown
   ========================================================= */
export interface RiskContribution {
    sensorId: string;
    sensorLabel: string;
    contribution: number;    // 0–100 percentage
}

/* =========================================================
   Incident Timeline
   ========================================================= */
export interface IncidentEvent {
    id: number;
    timestamp: number;       // Date.now()
    message: string;
    severity: 'info' | 'warning' | 'critical';
}

/* =========================================================
   Recommended Actions
   ========================================================= */
export interface RecommendedAction {
    action: string;
    priority: 'low' | 'medium' | 'high';
    context: string;
}

/* =========================================================
   Telemetry History Snapshot (for export)
   ========================================================= */
export interface TelemetrySnapshot {
    timestamp: number;
    dateStr: string;
    sensors: { id: string; label: string; value: number; unit: string; status: string }[];
    riskScore: number;
    riskStatus: string;
    anomalyPct: number;
    priorityScore: number;
    priorityStatus: string;
    activeFaults: string[];
}

/* =========================================================
   Sensor definitions
   ========================================================= */
const SENSOR_DEFS = [
    { id: 'eng_temp', label: 'Engine Temp', unit: '°C', min: 60, max: 130, nominal: 92 },
    { id: 'oil_pres', label: 'Oil Pressure', unit: 'kPa', min: 150, max: 500, nominal: 350 },
    { id: 'cool_flow', label: 'Coolant Flow', unit: 'L/m', min: 2, max: 12, nominal: 7.5 },
    { id: 'bat_volt', label: 'Battery', unit: 'V', min: 11, max: 14.8, nominal: 13.2 },
    { id: 'turbo_psi', label: 'Turbo Boost', unit: 'PSI', min: 0, max: 22, nominal: 14 },
    { id: 'exh_temp', label: 'Exhaust Temp', unit: '°C', min: 200, max: 900, nominal: 450 },
    { id: 'trans_temp', label: 'Trans Temp', unit: '°C', min: 60, max: 140, nominal: 85 },
    { id: 'fuel_rate', label: 'Fuel Rate', unit: 'L/h', min: 2, max: 30, nominal: 10 },
    { id: 'vib_rms', label: 'Vibration', unit: 'mm/s', min: 0, max: 15, nominal: 3.5 },
];

const PROPAGATION_LABELS = ['Engine', 'Cooling', 'Electrical', 'Transmission', 'Exhaust'];

/* =========================================================
   Rule Definitions — Deterministic Safety Logic
   ========================================================= */
const RULE_DEFS: { sensorId: string; condition: string; threshold: number; direction: 'above' | 'below'; severity: number }[] = [
    { sensorId: 'eng_temp', condition: 'Engine Temp > 110°C', threshold: 110, direction: 'above', severity: 5 },
    { sensorId: 'eng_temp', condition: 'Engine Temp > 120°C', threshold: 120, direction: 'above', severity: 8 },
    { sensorId: 'oil_pres', condition: 'Oil Pressure < 200 kPa', threshold: 200, direction: 'below', severity: 6 },
    { sensorId: 'bat_volt', condition: 'Battery < 11.5V', threshold: 11.5, direction: 'below', severity: 7 },
    { sensorId: 'cool_flow', condition: 'Coolant Flow < 4 L/m', threshold: 4, direction: 'below', severity: 5 },
    { sensorId: 'exh_temp', condition: 'Exhaust Temp > 750°C', threshold: 750, direction: 'above', severity: 7 },
    { sensorId: 'trans_temp', condition: 'Trans Temp > 120°C', threshold: 120, direction: 'above', severity: 4 },
    { sensorId: 'vib_rms', condition: 'Vibration > 10 mm/s', threshold: 10, direction: 'above', severity: 6 },
];

/* =========================================================
   Fault Injection Profiles
   ========================================================= */
const FAULT_PROFILES: Record<FaultType, { affectedSensors: { id: string; push: number }[]; label: string }> = {
    engine_overheat: {
        label: 'Engine Overheat',
        affectedSensors: [
            { id: 'eng_temp', push: 0.025 },    // push toward max
            { id: 'cool_flow', push: -0.02 },   // pull toward min
            { id: 'exh_temp', push: 0.015 },
            { id: 'vib_rms', push: 0.01 },
        ],
    },
    battery_fault: {
        label: 'Battery Fault',
        affectedSensors: [
            { id: 'bat_volt', push: -0.03 },
        ],
    },
    tire_pressure: {
        label: 'Low Tire Pressure',
        affectedSensors: [
            { id: 'vib_rms', push: 0.02 },
        ],
    },
    oil_pressure: {
        label: 'Oil Pressure Drop',
        affectedSensors: [
            { id: 'oil_pres', push: -0.025 },
            { id: 'eng_temp', push: 0.01 },
        ],
    },
};

/* =========================================================
   Recommendation Table — maps fault types to actions
   ========================================================= */
const RECOMMENDATION_TABLE: Record<FaultType, RecommendedAction[]> = {
    engine_overheat: [
        { action: 'Reduce engine load immediately', priority: 'high', context: 'Engine temperature rising above safe operating range' },
        { action: 'Inspect cooling system', priority: 'high', context: 'Coolant flow may be restricted or pump failing' },
        { action: 'Pull over if temp exceeds 120°C', priority: 'medium', context: 'Continued operation risks thermal damage' },
    ],
    battery_fault: [
        { action: 'Check alternator output', priority: 'high', context: 'Battery voltage dropping below safe threshold' },
        { action: 'Reduce electrical load', priority: 'medium', context: 'Disable non-essential systems to preserve charge' },
        { action: 'Schedule battery diagnostic', priority: 'low', context: 'Battery may need replacement' },
    ],
    tire_pressure: [
        { action: 'Reduce speed to 60 km/h', priority: 'high', context: 'Abnormal vibration detected from tire pressure anomaly' },
        { action: 'Inspect tire condition', priority: 'medium', context: 'Visual check for damage or pressure loss' },
        { action: 'Visit nearest tire service', priority: 'low', context: 'Pressure sensor indicates deviation from spec' },
    ],
    oil_pressure: [
        { action: 'Stop engine within 2 minutes', priority: 'high', context: 'Oil pressure critically low — lubrication failure risk' },
        { action: 'Check oil level immediately', priority: 'high', context: 'Low oil can cause catastrophic engine damage' },
        { action: 'Schedule diagnostic', priority: 'medium', context: 'Oil pump or sensor may be failing' },
    ],
};

/* Critical thresholds for slope-based TTC computation */
const CRITICAL_THRESHOLDS: { sensorId: string; threshold: number; direction: 'above' | 'below' }[] = [
    { sensorId: 'eng_temp', threshold: 120, direction: 'above' },
    { sensorId: 'oil_pres', threshold: 180, direction: 'below' },
    { sensorId: 'bat_volt', threshold: 11.2, direction: 'below' },
    { sensorId: 'exh_temp', threshold: 800, direction: 'above' },
    { sensorId: 'trans_temp', threshold: 130, direction: 'above' },
    { sensorId: 'vib_rms', threshold: 12, direction: 'above' },
    { sensorId: 'cool_flow', threshold: 3, direction: 'below' },
];

/* =========================================================
   Utilities
   ========================================================= */
function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

function sensorStatus(value: number, min: number, max: number, nominal: number): SensorReading['status'] {
    const deviation = Math.abs(value - nominal) / (max - min);
    if (deviation > 0.4) return 'critical';
    if (deviation > 0.25) return 'warning';
    return 'nominal';
}

/* =========================================================
   Hook
   ========================================================= */
export function useSimulatedTelemetry(intervalMs = 400) {
    const [sensors, setSensors] = useState<SensorReading[]>(() =>
        SENSOR_DEFS.map(d => ({
            ...d,
            value: d.nominal,
            status: 'nominal' as const,
            trend: Array(5).fill(d.nominal),
        }))
    );

    const [risk, setRisk] = useState<RiskState>({
        score: 12,
        persistence: 1.0,
        anomalyPct: 0,
        status: 'nominal',
        timeToCritical: 72 * 3600,
    });

    const [drifts, setDrifts] = useState<DriftEvent[]>([]);

    const [propagation, setPropagation] = useState<PropagationNode[]>(
        PROPAGATION_LABELS.map(label => ({
            id: label.toLowerCase(),
            label,
            active: false,
            severity: 0,
        }))
    );

    const [explanations, setExplanations] = useState<ExplainabilityEntry[]>([]);

    /* --- NEW states --------------------------------------- */
    const [mode, setMode] = useState<TelemetryMode>('simulated');
    const [activeFaults, setActiveFaults] = useState<ActiveFault[]>([]);
    const [ruleState, setRuleState] = useState<RuleEngineState>({ triggeredRules: [], totalSeverity: 0 });
    const [aiState, setAIState] = useState<AIEngineState>({
        anomalyScore: 0,
        riskScore: 0,
        confidence: 'High',
        features: [],
    });
    const [priorityState, setPriorityState] = useState<PriorityState>({
        ruleScore: 0,
        aiRisk: 0,
        finalPriority: 0,
        status: 'nominal',
    });
    const [trendDeviations, setTrendDeviations] = useState<TrendDeviation[]>([]);

    /* --- Predictive Intelligence states -------------------- */
    const [slopeTTC, setSlopeTTC] = useState<SlopeTTC | null>(null);
    const [baselines, setBaselines] = useState<SensorBaseline[]>([]);
    const [riskContributions, setRiskContributions] = useState<RiskContribution[]>([]);
    const [incidentLog, setIncidentLog] = useState<IncidentEvent[]>([]);
    const [recommendations, setRecommendations] = useState<RecommendedAction[]>([]);

    const riskRef = useRef(risk);
    const sensorsRef = useRef(sensors);
    const faultsRef = useRef(activeFaults);
    const ruleDurationsRef = useRef<Map<string, number>>(new Map());
    const historyRef = useRef<Map<string, number[]>>(new Map());
    const incidentIdRef = useRef(0);
    const lastRiskStatusRef = useRef<RiskState['status']>('nominal');
    const lastDriftActiveRef = useRef(false);
    riskRef.current = risk;
    sensorsRef.current = sensors;
    faultsRef.current = activeFaults;

    /* --- History Recording -------------------------------- */
    const MAX_HISTORY = 500;
    const [history, setHistory] = useState<TelemetrySnapshot[]>([]);
    const historyBufferRef = useRef<TelemetrySnapshot[]>([]);
    const historyTickCounterRef = useRef(0);

    const clearHistory = useCallback(() => {
        setHistory([]);
        historyBufferRef.current = [];
    }, []);

    /* --- Fault Injection ---------------------------------- */
    const injectFault = useCallback((type: FaultType) => {
        setActiveFaults(prev => {
            // Don't duplicate
            if (prev.find(f => f.type === type)) return prev;
            return [...prev, {
                type,
                label: FAULT_PROFILES[type].label,
                startedAt: Date.now(),
                intensity: 0,
            }];
        });
    }, []);

    const clearFault = useCallback((type: FaultType) => {
        setActiveFaults(prev => prev.filter(f => f.type !== type));
    }, []);

    const clearAllFaults = useCallback(() => {
        setActiveFaults([]);
    }, []);

    /* --- Main Tick ---------------------------------------- */
    const tick = useCallback(() => {
        const prev = sensorsRef.current;
        const prevRisk = riskRef.current;
        const currentFaults = faultsRef.current;

        // Ramp up fault intensities
        const updatedFaults = currentFaults.map(f => ({
            ...f,
            intensity: clamp(f.intensity + 0.03, 0, 1),
        }));
        if (currentFaults.length > 0) {
            setActiveFaults(updatedFaults);
        }

        const anomalyPhase = prevRisk.score > 40 || updatedFaults.length > 0;

        /* --- Sensors ---------------------------------------- */
        const newSensors = prev.map(s => {
            const def = SENSOR_DEFS.find(d => d.id === s.id)!;
            const range = def.max - def.min;
            const noise = (Math.random() - 0.5) * range * 0.02;

            // Natural drift from anomaly phase
            let drift = anomalyPhase && ['eng_temp', 'cool_flow', 'vib_rms'].includes(s.id)
                ? (s.id === 'cool_flow' ? -range * 0.008 : range * 0.006)
                : 0;

            // Injected fault push
            for (const fault of updatedFaults) {
                const profile = FAULT_PROFILES[fault.type];
                const affected = profile.affectedSensors.find(a => a.id === s.id);
                if (affected) {
                    drift += range * affected.push * fault.intensity;
                }
            }

            const meanRevert = updatedFaults.length === 0 ? (def.nominal - s.value) * 0.01 : 0;
            const newVal = clamp(s.value + noise + drift + meanRevert, def.min, def.max);
            return {
                ...s,
                value: newVal,
                trend: [...s.trend.slice(1), newVal],
                status: sensorStatus(newVal, def.min, def.max, def.nominal),
            };
        });

        /* --- LAYER 1: Rule Engine (Deterministic) ------------- */
        const triggered: TriggeredRule[] = [];
        const durations = ruleDurationsRef.current;

        for (const rule of RULE_DEFS) {
            const sensor = newSensors.find(s => s.id === rule.sensorId);
            if (!sensor) continue;

            const fired = rule.direction === 'above'
                ? sensor.value > rule.threshold
                : sensor.value < rule.threshold;

            if (fired) {
                const prevDur = durations.get(rule.condition) || 0;
                const newDur = prevDur + intervalMs / 1000;
                durations.set(rule.condition, newDur);
                triggered.push({
                    sensor: sensor.label,
                    condition: rule.condition,
                    severity: rule.severity,
                    duration: Math.round(newDur),
                });
            } else {
                durations.delete(rule.condition);
            }
        }

        // Normalize rule score to 0–1 (max severity is 5)
        const ruleMaxSev = triggered.length > 0
            ? Math.max(...triggered.map(r => r.severity))
            : 0;
        const ruleTotalSev = triggered.reduce((sum, r) => sum + r.severity, 0);
        const ruleScoreNorm = clamp(ruleMaxSev / 5, 0, 1);

        /* --- LAYER 2: Duration Escalation -------------------- */
        // Faults that persist should escalate risk — ramps over 10 seconds
        const maxDuration = triggered.length > 0
            ? Math.max(...triggered.map(r => r.duration))
            : 0;
        const durationFactor = clamp(maxDuration / 10, 0, 1);
        const ruleImpact = ruleScoreNorm * durationFactor;

        /* --- LAYER 3: AI Engine (Behavioral Deviation) ------- */
        // Compute deviation-based anomaly: mean absolute deviation from nominal
        let totalDeviation = 0;
        const contributingFeatures: string[] = [];
        const sensorDeviations: { id: string; label: string; deviation: number }[] = [];

        for (const s of newSensors) {
            const def = SENSOR_DEFS.find(d => d.id === s.id)!;
            const dev = Math.abs(s.value - def.nominal) / (def.max - def.min);
            totalDeviation += dev;
            sensorDeviations.push({ id: s.id, label: s.label, deviation: dev });
            if (dev > 0.2) {
                contributingFeatures.push(s.label);
            }
        }
        const avgDeviation = totalDeviation / newSensors.length;

        // Simulate Isolation Forest: sigmoid transform of average deviation
        const rawAnomaly = clamp(1 / (1 + Math.exp(-12 * (avgDeviation - 0.15))), 0, 1);
        const aiImpact = rawAnomaly; // Already 0–1

        // AI confidence: low deviation = high confidence in normality
        const aiConfidence: AIEngineState['confidence'] =
            avgDeviation < 0.1 ? 'High' : avgDeviation < 0.25 ? 'Medium' : 'High';

        /* --- CORRELATION DRIFT BOOST ------------------------- */
        // If 2+ sensors deviate together, add small boost (cross-sensor reasoning)
        const highDevSensors = sensorDeviations.filter(s => s.deviation > 0.25);
        const correlationBoost = highDevSensors.length >= 2 ? 0.08 : 0;

        /* --- LAYER 4: Weighted Priority Engine --------------- */
        const rawFinalRisk = clamp(
            (0.6 * ruleImpact) + (0.4 * aiImpact) + correlationBoost,
            0, 1
        );

        // Persistence memory: when no faults, decay slowly instead of snapping to zero
        const prevFinalRisk = prevRisk.score / 100; // convert from 0–100 to 0–1
        let finalRisk01: number;
        if (updatedFaults.length === 0 && triggered.length === 0) {
            // Decay: maintain 95% of previous risk per tick
            finalRisk01 = Math.max(rawFinalRisk, prevFinalRisk * 0.95);
        } else {
            finalRisk01 = rawFinalRisk;
        }

        // Exponential smoothing for visual stability
        const smoothedRisk01 = 0.82 * prevFinalRisk + 0.18 * finalRisk01;

        // Scale to 0–100 for display and to 0–10 for priority
        const smoothedRisk100 = smoothedRisk01 * 100;
        const finalPriority10 = +(smoothedRisk01 * 10).toFixed(1);

        // Status mapping
        const priorityStatus: PriorityState['status'] =
            smoothedRisk01 > 0.6 ? 'critical'
                : smoothedRisk01 > 0.3 ? 'warning'
                    : smoothedRisk01 > 0.15 ? 'elevated'
                        : 'nominal';

        /* --- Contribution Breakdown (Explainability) --------- */
        const totalDevSum = sensorDeviations.reduce((s, d) => s + d.deviation, 0);
        const contributions = sensorDeviations
            .filter(s => s.deviation > 0.1)
            .map(s => ({
                sensor: s.label,
                contribution: totalDevSum > 0 ? Math.round((s.deviation / totalDevSum) * 100) : 0,
            }))
            .sort((a, b) => b.contribution - a.contribution);

        /* --- Risk (Main state, driven by priority) ----------- */
        const criticalCount = newSensors.filter(s => s.status === 'critical').length;
        const anomalyPct = +(rawAnomaly * 100).toFixed(1);
        const persistence = criticalCount > 0
            ? clamp(prevRisk.persistence + 0.02, 1, 3)
            : clamp(prevRisk.persistence * 0.99, 1, 3); // slow decay
        const riskStatus: RiskState['status'] =
            smoothedRisk100 > 60 ? 'critical' : smoothedRisk100 > 30 ? 'warning' : smoothedRisk100 > 15 ? 'elevated' : 'nominal';
        const ttc = smoothedRisk100 > 10
            ? Math.max(0, prevRisk.timeToCritical - (intervalMs / 1000) * (smoothedRisk100 / 20))
            : Math.min(72 * 3600, prevRisk.timeToCritical + 60);

        /* --- Drifts ----------------------------------------- */
        const hasCrossDeviation = highDevSensors.length >= 2;
        const newDrifts: DriftEvent[] = hasCrossDeviation
            ? [
                { sensorA: 'eng_temp', sensorB: 'cool_flow', correlation: -0.87, drift: +(correlationBoost * 2.5).toFixed(2), active: true },
                { sensorA: 'eng_temp', sensorB: 'vib_rms', correlation: 0.72, drift: +(correlationBoost * 1.8).toFixed(2), active: true },
            ]
            : [];

        /* --- Propagation ------------------------------------ */
        const newPropagation = PROPAGATION_LABELS.map((label, i) => {
            const threshold = 0.15 + i * 0.12; // thresholds in 0–1 range
            const active = smoothedRisk01 > threshold;
            const severity = active ? clamp((smoothedRisk01 - threshold) / 0.4, 0, 1) : 0;
            return { id: label.toLowerCase(), label, active, severity };
        });

        /* --- Explainability --------------------------------- */
        const newExplanations: ExplainabilityEntry[] = [];
        if (smoothedRisk100 > 15) {
            contributions.slice(0, 3).forEach(c => {
                const s = newSensors.find(sen => sen.label === c.sensor);
                const def = s ? SENSOR_DEFS.find(d => d.id === s.id) : null;
                const dev = s && def ? Math.abs(s.value - def.nominal) / (def.max - def.min) : 0;
                const dur = triggered.find(t => t.sensor === c.sensor)?.duration || 0;
                newExplanations.push({
                    sensor: c.sensor,
                    contribution: c.contribution,
                    driftDuration: dur,
                    reason: dev > 0.4
                        ? `${c.sensor} exceeded safe operating range (${c.contribution}% contribution)`
                        : `${c.sensor} deviating from nominal baseline (${c.contribution}% contribution)`,
                });
            });
        }

        /* --- Commit ----------------------------------------- */
        setSensors(newSensors);
        setRisk({
            score: +smoothedRisk100.toFixed(1),
            persistence: +persistence.toFixed(2),
            anomalyPct,
            status: riskStatus,
            timeToCritical: ttc,
        });
        setDrifts(newDrifts);
        setPropagation(newPropagation);
        setExplanations(newExplanations);

        // Engine state commits
        setRuleState({ triggeredRules: triggered, totalSeverity: ruleTotalSev });
        setAIState({
            anomalyScore: +rawAnomaly.toFixed(3),
            riskScore: +(aiImpact * 10).toFixed(1),
            confidence: aiConfidence,
            features: contributingFeatures,
        });
        setPriorityState({
            ruleScore: +(ruleImpact * 10).toFixed(1),
            aiRisk: +(aiImpact * 10).toFixed(1),
            finalPriority: finalPriority10,
            status: priorityStatus,
        });

        // --- TREND DEVIATION — Behavior shift detection ---
        const deviations: TrendDeviation[] = [];
        const HISTORY_SIZE = 12; // rolling window of ~5s at 400ms interval
        const BASELINE_RATES: Record<string, number> = {
            eng_temp: 0.3, oil_pres: 1.5, bat_volt: 0.015, vib_rms: 0.08,
            cool_flow: 0.05, exh_temp: 2.0, trans_temp: 0.2,
        };

        for (const s of newSensors) {
            const hist = historyRef.current.get(s.id) || [];
            hist.push(s.value);
            if (hist.length > HISTORY_SIZE) hist.shift();
            historyRef.current.set(s.id, hist);

            if (hist.length >= 4) {
                // Calculate rate of change over recent window
                const recent = hist.slice(-4);
                const rateOfChange = Math.abs(recent[recent.length - 1] - recent[0]) / 4;
                const baseline = BASELINE_RATES[s.id] || 0.5;
                const multiplier = rateOfChange / baseline;

                if (multiplier > 1.5) {
                    const direction = recent[recent.length - 1] > recent[0] ? 'rising' : 'falling';
                    const severity = multiplier > 4 ? 'high' : multiplier > 2.5 ? 'medium' : 'low';
                    deviations.push({
                        sensorId: s.id,
                        sensorLabel: s.label,
                        direction,
                        multiplier: +multiplier.toFixed(1),
                        message: `${s.label} ${direction} ${multiplier.toFixed(1)}× faster than historical baseline`,
                        severity,
                    });
                }
            }
        }
        setTrendDeviations(deviations);

        /* --- SLOPE-BASED TIME-TO-CRITICAL -------------------- */
        let bestTTC: SlopeTTC | null = null;
        const tickSeconds = intervalMs / 1000;

        for (const ct of CRITICAL_THRESHOLDS) {
            const sensor = newSensors.find(s => s.id === ct.sensorId);
            const def = SENSOR_DEFS.find(d => d.id === ct.sensorId);
            if (!sensor || !def) continue;

            const hist = historyRef.current.get(ct.sensorId) || [];
            if (hist.length < 4) continue;

            const recent = hist.slice(-6);
            // Rate per tick
            const ratePerTick = (recent[recent.length - 1] - recent[0]) / recent.length;
            const ratePerMinute = (ratePerTick / tickSeconds) * 60;

            // Check if trending toward critical
            const isTrendingBad = ct.direction === 'above'
                ? ratePerTick > 0 && sensor.value < ct.threshold
                : ratePerTick < 0 && sensor.value > ct.threshold;

            if (isTrendingBad && Math.abs(ratePerTick) > 0.001) {
                const gap = Math.abs(ct.threshold - sensor.value);
                const ratePerSec = Math.abs(ratePerTick) / tickSeconds;
                const estSeconds = gap / ratePerSec;

                if (!bestTTC || estSeconds < bestTTC.estimatedSeconds) {
                    bestTTC = {
                        sensorId: ct.sensorId,
                        sensorLabel: sensor.label,
                        rate: +ratePerMinute.toFixed(2),
                        unit: def.unit,
                        estimatedSeconds: +estSeconds.toFixed(0),
                        threshold: ct.threshold,
                        current: +sensor.value.toFixed(1),
                    };
                }
            }
        }
        setSlopeTTC(bestTTC);

        /* --- ADAPTIVE BASELINES (σ notation) ------------------ */
        const newBaselines: SensorBaseline[] = [];
        for (const s of newSensors) {
            const hist = historyRef.current.get(s.id) || [];
            if (hist.length < 3) {
                newBaselines.push({ sensorId: s.id, mean: s.value, stdDev: 0, sigmaDeviation: 0 });
                continue;
            }
            const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
            const variance = hist.reduce((a, b) => a + (b - mean) ** 2, 0) / hist.length;
            const stdDev = Math.sqrt(variance);
            const sigmaDeviation = stdDev > 0.001 ? Math.abs(s.value - mean) / stdDev : 0;
            newBaselines.push({
                sensorId: s.id,
                mean: +mean.toFixed(2),
                stdDev: +stdDev.toFixed(3),
                sigmaDeviation: +sigmaDeviation.toFixed(1),
            });
        }
        setBaselines(newBaselines);

        /* --- RISK CONTRIBUTION BREAKDOWN --------------------- */
        const newRiskContributions: RiskContribution[] = contributions.map(c => {
            const sensor = newSensors.find(s => s.label === c.sensor);
            return {
                sensorId: sensor?.id || '',
                sensorLabel: c.sensor,
                contribution: c.contribution,
            };
        });
        setRiskContributions(newRiskContributions);

        /* --- INCIDENT TIMELINE LOG --------------------------- */
        const newEvents: IncidentEvent[] = [];
        const now = Date.now();

        // Risk status transitions
        if (riskStatus !== lastRiskStatusRef.current) {
            newEvents.push({
                id: ++incidentIdRef.current,
                timestamp: now,
                message: `Risk escalated to ${riskStatus.toUpperCase()}`,
                severity: riskStatus === 'critical' ? 'critical' : riskStatus === 'warning' ? 'warning' : 'info',
            });
            lastRiskStatusRef.current = riskStatus;
        }

        // Sensor deviation events (only on new critical sensors)
        for (const s of newSensors) {
            if (s.status === 'critical') {
                const prevSensor = prev.find(p => p.id === s.id);
                if (prevSensor && prevSensor.status !== 'critical') {
                    newEvents.push({
                        id: ++incidentIdRef.current,
                        timestamp: now,
                        message: `${s.label} deviation detected — entered critical range`,
                        severity: 'critical',
                    });
                }
            } else if (s.status === 'warning') {
                const prevSensor = prev.find(p => p.id === s.id);
                if (prevSensor && prevSensor.status === 'nominal') {
                    newEvents.push({
                        id: ++incidentIdRef.current,
                        timestamp: now,
                        message: `${s.label} deviation detected — warning threshold`,
                        severity: 'warning',
                    });
                }
            }
        }

        // Correlation drift events
        const hasDriftNow = newDrifts.length > 0;
        if (hasDriftNow && !lastDriftActiveRef.current) {
            newEvents.push({
                id: ++incidentIdRef.current,
                timestamp: now,
                message: 'Correlation drift detected — cross-sensor anomaly',
                severity: 'warning',
            });
        }
        lastDriftActiveRef.current = hasDriftNow;

        // AI anomaly score spike
        if (rawAnomaly > 0.5 && newEvents.length === 0 && smoothedRisk100 > 30) {
            newEvents.push({
                id: ++incidentIdRef.current,
                timestamp: now,
                message: `AI anomaly score increased to ${(rawAnomaly * 100).toFixed(0)}%`,
                severity: 'info',
            });
        }

        if (newEvents.length > 0) {
            setIncidentLog(prev => [...prev, ...newEvents].slice(-25));
        }

        /* --- RECOMMENDED ACTIONS ----------------------------- */
        const newRecs: RecommendedAction[] = [];
        for (const fault of updatedFaults) {
            const recs = RECOMMENDATION_TABLE[fault.type];
            if (recs) {
                // Only add recs not already present
                for (const r of recs) {
                    if (!newRecs.find(nr => nr.action === r.action)) {
                        newRecs.push(r);
                    }
                }
            }
        }
        // Add generic recs based on risk level
        if (smoothedRisk100 > 60 && newRecs.length === 0) {
            newRecs.push({ action: 'Reduce vehicle load', priority: 'high', context: 'Multiple systems showing stress' });
            newRecs.push({ action: 'Schedule comprehensive diagnostic', priority: 'medium', context: 'Elevated risk across subsystems' });
        }
        setRecommendations(newRecs);

        /* --- HISTORY SNAPSHOT (every 3rd tick) --------------- */
        historyTickCounterRef.current++;
        if (historyTickCounterRef.current % 3 === 0) {
            const snapshot: TelemetrySnapshot = {
                timestamp: Date.now(),
                dateStr: new Date().toLocaleString(),
                sensors: newSensors.map(s => ({
                    id: s.id,
                    label: s.label,
                    value: +s.value.toFixed(2),
                    unit: s.unit,
                    status: s.status,
                })),
                riskScore: +smoothedRisk100.toFixed(1),
                riskStatus,
                anomalyPct,
                priorityScore: finalPriority10,
                priorityStatus,
                activeFaults: updatedFaults.map(f => f.label),
            };
            historyBufferRef.current = [...historyBufferRef.current.slice(-(MAX_HISTORY - 1)), snapshot];
            setHistory(historyBufferRef.current);
        }
    }, [intervalMs]);

    useEffect(() => {
        const id = setInterval(tick, intervalMs);
        return () => clearInterval(id);
    }, [tick, intervalMs]);

    return {
        // Original
        sensors, risk, drifts, propagation, explanations,
        // Engines
        mode, setMode,
        activeFaults, injectFault, clearFault, clearAllFaults,
        ruleState, aiState, priorityState,
        trendDeviations,
        // Predictive Intelligence
        slopeTTC, baselines, riskContributions,
        incidentLog, recommendations,
        // History
        history, clearHistory,
    };
}
