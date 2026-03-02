import React from 'react';
import type { ExplainabilityEntry } from '../../hooks/useSimulatedTelemetry';

interface Props {
    entries: ExplainabilityEntry[];
    riskScore: number;
    timeToCritical?: number;
}

function formatTTC(seconds: number): string {
    if (seconds >= 3600) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const ExplainabilityPanel: React.FC<Props> = React.memo(({ entries, riskScore, timeToCritical }) => {
    const status = riskScore > 60 ? 'Critical' : riskScore > 30 ? 'Warning' : riskScore > 15 ? 'Elevated' : 'Nominal';
    const statusClass = status.toLowerCase();

    if (entries.length === 0) {
        return (
            <div className="explain-panel">
                <h3 className="panel-title">Risk Explanation</h3>
                <div className="explain-nominal">
                    <span className="explain-nominal__dot" />
                    <span>All systems nominal — no risk drivers detected</span>
                </div>
            </div>
        );
    }

    const primary = entries[0];
    const secondary = entries[1];

    return (
        <div className="explain-panel">
            <h3 className="panel-title">Risk Explanation</h3>

            {/* Risk Summary Line */}
            <div className="explain-risk-line">
                <span>Current Risk:</span>
                <span className={`explain-risk-value explain-risk-value--${statusClass}`}>
                    {riskScore.toFixed(1)} ({status})
                </span>
            </div>

            {/* Drivers */}
            <div className="explain-drivers">
                <div className="explain-driver">
                    <span className="explain-driver__label">Primary Driver</span>
                    <span className="explain-driver__sensor">{primary.sensor}</span>
                    <span className="explain-driver__pct">{primary.contribution}%</span>
                </div>
                {secondary && (
                    <div className="explain-driver">
                        <span className="explain-driver__label">Secondary</span>
                        <span className="explain-driver__sensor">{secondary.sensor}</span>
                        <span className="explain-driver__pct">{secondary.contribution}%</span>
                    </div>
                )}
            </div>

            {/* Bars */}
            <div className="explain-bars">
                {entries.slice(0, 3).map((entry, i) => (
                    <div className="explain-bar-row" key={i}>
                        <span className="explain-bar-label">{entry.sensor}</span>
                        <div className="explain-bar-track">
                            <div
                                className={`explain-bar-fill explain-bar-fill--${statusClass}`}
                                style={{ width: `${Math.min(entry.contribution, 100)}%` }}
                            />
                        </div>
                        <span className="explain-bar-pct">{entry.contribution}%</span>
                    </div>
                ))}
            </div>

            {/* Time to Critical */}
            {timeToCritical !== undefined && riskScore > 15 && (
                <div className="explain-ttc">
                    Est. Time to Critical: <strong>{formatTTC(timeToCritical)}</strong>
                </div>
            )}
        </div>
    );
});

ExplainabilityPanel.displayName = 'ExplainabilityPanel';
export default ExplainabilityPanel;
