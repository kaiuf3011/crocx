import React from 'react';
import type { RecommendedAction } from '../../hooks/useSimulatedTelemetry';
import { AlertTriangle, Shield, Wrench } from 'lucide-react';

interface Props {
    recommendations: RecommendedAction[];
}

const priorityIcon = (priority: RecommendedAction['priority']) => {
    switch (priority) {
        case 'high': return <AlertTriangle size={13} />;
        case 'medium': return <Shield size={13} />;
        case 'low': return <Wrench size={13} />;
    }
};

const RecommendedActions: React.FC<Props> = React.memo(({ recommendations }) => {
    if (recommendations.length === 0) {
        return (
            <div className="rec-actions">
                <h3 className="panel-title">Recommended Actions</h3>
                <div className="rec-actions__idle">
                    <span className="rec-actions__idle-dot" />
                    <span>No actions required</span>
                </div>
            </div>
        );
    }

    return (
        <div className="rec-actions">
            <h3 className="panel-title">Recommended Actions</h3>
            <div className="rec-actions__list">
                {recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className={`rec-actions__item rec-actions__item--${rec.priority}`}>
                        <div className="rec-actions__icon">
                            {priorityIcon(rec.priority)}
                        </div>
                        <div className="rec-actions__body">
                            <span className="rec-actions__action">{rec.action}</span>
                            <span className="rec-actions__context">{rec.context}</span>
                        </div>
                        <span className={`rec-actions__badge rec-actions__badge--${rec.priority}`}>
                            {rec.priority.toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

RecommendedActions.displayName = 'RecommendedActions';
export default RecommendedActions;
