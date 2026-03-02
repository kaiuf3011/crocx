import React from 'react';
import type { SensorReading, SensorBaseline } from '../../hooks/useSimulatedTelemetry';

/* ----- Single Card -------------------------------------------------- */
interface CardProps {
    sensor: SensorReading;
    baseline?: SensorBaseline;
}

const statusColor: Record<string, string> = {
    nominal: 'var(--cc-text-muted)', // Neutral tone for nominal
    warning: 'var(--cc-gold)',       // Soft gold for anomaly
    critical: 'var(--cc-red)',       // Red to shift
};

const SensorCard: React.FC<CardProps> = React.memo(({ sensor, baseline }) => {
    const pct = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
    const sigma = baseline?.sigmaDeviation ?? 0;
    const showSigma = sigma > 1.5;
    const color = statusColor[sensor.status];

    // Sparkline from trend
    const trendMin = Math.min(...sensor.trend);
    const trendMax = Math.max(...sensor.trend) || 1;
    const trendRange = trendMax - trendMin || 1;
    const points = sensor.trend
        .map((v, i) => `${(i / (sensor.trend.length - 1)) * 48},${24 - ((v - trendMin) / trendRange) * 20}`)
        .join(' ');

    return (
        <div className="sensor-card" data-status={sensor.status}>
            {/* Mini gauge */}
            <div className="sensor-card__gauge">
                <svg width="48" height="28" viewBox="0 0 48 28">
                    <path
                        d="M4 24 A 20 20 0 0 1 44 24"
                        fill="none"
                        stroke="var(--cc-border)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d="M4 24 A 20 20 0 0 1 44 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 63} 63`}
                        style={{ transition: 'stroke-dasharray 400ms ease-out' }}
                    />
                </svg>
            </div>

            <div className="sensor-card__body">
                <div className="sensor-card__label">{sensor.label}</div>
                <div className="sensor-card__value" style={{ color: sensor.status === 'nominal' ? 'var(--cc-text)' : color }}>
                    {sensor.value.toFixed(1)}
                    <span className="sensor-card__unit">{sensor.unit}</span>
                </div>
                <div className="sensor-card__status-row">
                    <span className="sensor-card__status" style={{ color }}>
                        {sensor.status.toUpperCase()}
                    </span>
                    {showSigma && (
                        <span
                            className={`sensor-card__sigma ${sigma > 3 ? 'sensor-card__sigma--critical' : sigma > 2 ? 'sensor-card__sigma--warning' : ''}`}
                        >
                            {sigma.toFixed(1)}σ
                        </span>
                    )}
                </div>
            </div>

            {/* Trend sparkline */}
            <div className="sensor-card__trend">
                <svg width="48" height="24" viewBox="0 0 48 24">
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        opacity="0.6"
                    />
                </svg>
            </div>
        </div>
    );
});

SensorCard.displayName = 'SensorCard';

/* ----- Grid --------------------------------------------------------- */
interface GridProps {
    sensors: SensorReading[];
    baselines?: SensorBaseline[];
}

const SensorGrid: React.FC<GridProps> = React.memo(({ sensors, baselines }) => (
    <div className="sensor-grid">
        {sensors.map(s => (
            <SensorCard
                key={s.id}
                sensor={s}
                baseline={baselines?.find(b => b.sensorId === s.id)}
            />
        ))}
    </div>
));

SensorGrid.displayName = 'SensorGrid';
export default SensorGrid;
