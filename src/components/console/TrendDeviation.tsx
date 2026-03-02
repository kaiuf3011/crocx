import type { TrendDeviation } from '../../hooks/useSimulatedTelemetry';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
    deviations: TrendDeviation[];
}

export default function TrendDeviationPanel({ deviations }: Props) {
    const sorted = [...deviations].sort((a, b) => b.multiplier - a.multiplier);

    return (
        <div className="td-panel">
            <h2 className="panel-title">Behavioral Shift Engine</h2>

            {sorted.length === 0 ? (
                <div className="td-empty">
                    All sensor rates within historical baseline.
                </div>
            ) : (
                <div className="td-list">
                    {sorted.slice(0, 3).map(d => (
                        <div className={`td-item td-item--${d.severity}`} key={d.sensorId}>
                            <div className="td-item__icon">
                                {d.direction === 'rising' ? (
                                    <TrendingUp size={13} />
                                ) : (
                                    <TrendingDown size={13} />
                                )}
                            </div>
                            <div className="td-item__body">
                                <div className="td-item__msg">
                                    {d.sensorLabel} {d.direction} <strong>{d.multiplier}×</strong> baseline
                                </div>
                            </div>
                            <div className="td-item__multiplier">
                                {d.multiplier}×
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
