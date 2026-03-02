import type { RuleEngineState } from '../../hooks/useSimulatedTelemetry';

interface Props {
    ruleState: RuleEngineState;
}

export default function RuleEnginePanel({ ruleState }: Props) {
    const { triggeredRules } = ruleState;

    return (
        <div className="intel-panel rule-panel">
            <h3 className="panel-title">Rule Engine</h3>
            <div className="intel-label">DETERMINISTIC LOGIC</div>

            {triggeredRules.length === 0 ? (
                <div className="intel-empty">No rules triggered. All thresholds within safe bounds.</div>
            ) : (
                <div className="rule-list">
                    {triggeredRules.map((rule, i) => (
                        <div className="rule-entry" key={i} data-severity={rule.severity > 6 ? 'high' : rule.severity > 3 ? 'med' : 'low'}>
                            <div className="rule-entry__header">
                                <span className="rule-entry__condition">{rule.condition}</span>
                                <span className="rule-entry__severity">SEV {rule.severity}</span>
                            </div>
                            <div className="rule-entry__meta">
                                <span>{rule.sensor}</span>
                                <span>Duration: {rule.duration}s</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
