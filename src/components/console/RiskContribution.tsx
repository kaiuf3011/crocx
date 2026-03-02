import React from 'react';
import type { RiskContribution as RiskContributionType } from '../../hooks/useSimulatedTelemetry';

interface Props {
    contributions: RiskContributionType[];
    riskScore: number;
}

const RiskContributionBar: React.FC<Props> = React.memo(({ contributions, riskScore }) => {
    if (contributions.length === 0 || riskScore < 10) {
        return (
            <div className="risk-contrib">
                <h3 className="panel-title">Risk Decomposition</h3>
                <div className="risk-contrib__idle">
                    <span className="risk-contrib__idle-dot" />
                    <span>No active risk contributors</span>
                </div>
            </div>
        );
    }

    // Assign colors based on contribution rank
    const getColor = (index: number) => {
        if (index === 0) return riskScore > 60 ? 'var(--cc-red)' : 'var(--cc-gold)';
        if (index === 1) return 'rgba(175, 146, 77, 0.7)';
        return 'rgba(175, 146, 77, 0.4)';
    };

    return (
        <div className="risk-contrib">
            <h3 className="panel-title">Risk Decomposition</h3>

            {/* Segmented bar */}
            <div className="risk-contrib__bar">
                {contributions.map((c, i) => (
                    <div
                        key={c.sensorId}
                        className="risk-contrib__segment"
                        style={{
                            width: `${Math.max(c.contribution, 4)}%`,
                            backgroundColor: getColor(i),
                        }}
                        title={`${c.sensorLabel}: ${c.contribution}%`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="risk-contrib__legend">
                {contributions.slice(0, 4).map((c, i) => (
                    <div key={c.sensorId} className="risk-contrib__item">
                        <span
                            className="risk-contrib__dot"
                            style={{ backgroundColor: getColor(i) }}
                        />
                        <span className="risk-contrib__label">{c.sensorLabel}</span>
                        <span className="risk-contrib__pct">{c.contribution}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

RiskContributionBar.displayName = 'RiskContributionBar';
export default RiskContributionBar;
