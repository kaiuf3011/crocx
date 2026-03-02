import React from 'react';
import type { RiskState } from '../../hooks/useSimulatedTelemetry';

interface Props {
    risk: RiskState;
    mousePos?: { x: number; y: number };
}

export default function RiskDial({ risk, mousePos }: Props) {
    // Parallax Tilt Calculation
    const tiltX = mousePos ? (mousePos.y - 50) / 20 : 0; // Invert Y for natural tilt
    const tiltY = mousePos ? -(mousePos.x - 50) / 20 : 0;
    const transformStyle = mousePos
        ? { transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }
        : {};

    // 260px size -> r=110, cx=130, cy=130, circ= ~691
    const size = 260;
    const center = size / 2;
    const radius = size * 0.42;
    const circumference = 2 * Math.PI * radius;
    const progress = (risk.score / 100) * circumference;

    const riskColor = () => {
        if (risk.score < 25) return 'var(--cc-text-muted)';
        if (risk.score < 75) return 'var(--cc-gold)';
        return 'var(--cc-red)';
    };

    const color = riskColor();

    // Map out subtle inner ring ticks
    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i < 40; i++) {
            const angle = (i * 9) * (Math.PI / 180);
            const r1 = radius - 15;
            const r2 = radius - 20;
            const x1 = center + r1 * Math.cos(angle);
            const y1 = center + r1 * Math.sin(angle);
            const x2 = center + r2 * Math.cos(angle);
            const y2 = center + r2 * Math.sin(angle);

            // Highlight ticks based on progress
            const tickProgress = (i / 40) * 100;
            const isFilled = risk.score > tickProgress;

            ticks.push(
                <line
                    key={i}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isFilled ? color : "rgba(255,255,255,0.05)"}
                    strokeWidth="1.5"
                />
            );
        }
        return ticks;
    };

    return (
        <div className="risk-dial">
            <h2 className="panel-title">System Risk Core</h2>

            <div className="risk-dial__visual" style={transformStyle}>
                <svg className="risk-dial__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.3" />
                        </filter>
                        <linearGradient id="highlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                            <stop offset="30%" stopColor="#fff" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Background track */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="1.5"
                    />

                    {/* Progress arc (Matte) */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${center} ${center})`}
                        filter="url(#soft-shadow)"
                        style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 400ms ease' }}
                    />

                    {/* Inner Ticks Ring */}
                    <g transform={`rotate(-90 ${center} ${center})`}>
                        {renderTicks()}
                    </g>

                    {/* Slow Rotating Highlight Overlay */}
                    <g className="risk-dial__highlight">
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="url(#highlight-grad)"
                            strokeWidth="3"
                            opacity={risk.score > 25 ? 0.6 : 0}
                        />
                    </g>
                </svg>

                <div
                    className="risk-dial__score"
                    style={{ color: risk.score > 25 ? color : 'var(--cc-text)' }}
                >
                    {risk.score.toFixed(1)}
                </div>
                <div className="risk-dial__label">Threat Level</div>
            </div>

            <div className="risk-dial__metrics">
                <div className="risk-metric">
                    <span className="risk-metric__label">Persistence</span>
                    <span className="risk-metric__value">{risk.persistence.toFixed(2)}×</span>
                </div>
                <div className="risk-metric">
                    <span className="risk-metric__label">Anomaly</span>
                    <span className="risk-metric__value">{risk.anomalyPct.toFixed(1)}%</span>
                </div>
                <div className="risk-metric">
                    <span className="risk-metric__label">Status</span>
                    <span className="risk-metric__value risk-metric__status" data-status={risk.status}>
                        {risk.status.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
RiskDial.displayName = 'RiskDial';
