import type { AIEngineState } from '../../hooks/useSimulatedTelemetry';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
    aiState: AIEngineState;
}

export default function AIEnginePanel({ aiState }: Props) {
    const { anomalyScore, riskScore, confidence, features } = aiState;
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="intel-panel ai-panel">
            <div className="ai-title-row">
                <h3 className="panel-title">AI Engine</h3>
                <div
                    className="ai-info-trigger"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Info size={13} />
                    {showTooltip && (
                        <div className="ai-info-tooltip">
                            Isolation Forest trained on normalized telemetry data. Risk score derived from anomaly decision function. Confidence based on feature contribution variance.
                        </div>
                    )}
                </div>
            </div>
            <div className="intel-label">PROBABILISTIC DETECTION</div>

            <div className="ai-metrics">
                <div className="ai-metric">
                    <span className="ai-metric__label">Anomaly Score</span>
                    <span className="ai-metric__value" data-level={anomalyScore > 0.7 ? 'critical' : anomalyScore > 0.3 ? 'warning' : 'nominal'}>
                        {anomalyScore.toFixed(2)}
                    </span>
                </div>
                <div className="ai-metric">
                    <span className="ai-metric__label">Risk Score</span>
                    <span className="ai-metric__value" data-level={riskScore > 7 ? 'critical' : riskScore > 4 ? 'warning' : 'nominal'}>
                        {riskScore.toFixed(1)}<span className="ai-metric__unit">/10</span>
                    </span>
                </div>
                <div className="ai-metric">
                    <span className="ai-metric__label">Confidence</span>
                    <span className="ai-metric__value ai-metric__confidence">{confidence}</span>
                </div>
            </div>

            {features.length > 0 && (
                <div className="ai-features">
                    <div className="ai-features__label">Contributing Features</div>
                    <div className="ai-features__list">
                        {features.map((f, i) => (
                            <span className="ai-feature-tag" key={i}>{f}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
