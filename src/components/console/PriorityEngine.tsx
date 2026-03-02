import type { PriorityState } from '../../hooks/useSimulatedTelemetry';
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
    priorityState: PriorityState;
}

export default function PriorityEngine({ priorityState }: Props) {
    const { ruleScore, aiRisk, finalPriority, status } = priorityState;

    const StatusIcon = status === 'critical' ? XCircle :
        status === 'warning' ? AlertTriangle :
            status === 'elevated' ? AlertCircle : CheckCircle2;

    return (
        <div className="intel-panel priority-panel">
            <h3 className="panel-title">Priority Engine</h3>
            <div className="intel-label">WEIGHTED FUSION</div>

            <div className="priority-equation">
                <div className="priority-eq__row">
                    <span className="priority-eq__label">Rule Score</span>
                    <span className="priority-eq__value">{ruleScore.toFixed(1)}</span>
                    <span className="priority-eq__weight">×0.6</span>
                </div>
                <div className="priority-eq__row">
                    <span className="priority-eq__label">AI Risk</span>
                    <span className="priority-eq__value">{aiRisk.toFixed(1)}</span>
                    <span className="priority-eq__weight">×0.4</span>
                </div>
                <div className="priority-eq__divider" />
                <div className="priority-eq__result">
                    <span className="priority-eq__label">Final Priority</span>
                    <span className="priority-eq__final" data-status={status}>{finalPriority.toFixed(1)}</span>
                </div>
            </div>

            <div className="priority-status" data-status={status}>
                <span style={{ display: 'flex', alignItems: 'center' }}><StatusIcon size={16} /></span>
                <span>{status.toUpperCase()}</span>
            </div>
        </div>
    );
}
