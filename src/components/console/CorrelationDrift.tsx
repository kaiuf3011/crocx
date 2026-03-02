
import type { DriftEvent } from '../../hooks/useSimulatedTelemetry';

interface Props {
    drifts: DriftEvent[];
}

export default function CorrelationDrift({ drifts }: Props) {
    // Compact 7x7 matrix
    const headers = ['ENG', 'BAT', 'INV', 'MTR', 'COOL', 'AERO', 'SYS'];
    const sensorIds = ['eng_temp', 'bat_volt', 'trans_temp', 'mtr_rpm', 'cool_flow', 'turbo_psi', 'vib_rms'];
    const matrixSize = headers.length;
    const cells = [];

    // Find strongest drift for summary
    let strongestDrift: DriftEvent | null = null;
    let strongestVal = 0;
    for (const d of drifts) {
        if (d.active && d.drift > strongestVal) {
            strongestVal = d.drift;
            strongestDrift = d;
        }
    }

    // Map sensor IDs to labels
    const idToLabel: Record<string, string> = {
        eng_temp: 'Engine', bat_volt: 'Battery', trans_temp: 'Trans',
        mtr_rpm: 'Motor', cool_flow: 'Cooling', turbo_psi: 'Turbo', vib_rms: 'Vibration',
    };

    for (let row = 0; row <= matrixSize; row++) {
        for (let col = 0; col <= matrixSize; col++) {
            const isHeaderRow = row === 0;
            const isHeaderCol = col === 0;

            if (isHeaderRow && isHeaderCol) {
                cells.push(<div key="0-0" className="drift-cell drift-header" />);
                continue;
            }

            if (isHeaderRow) {
                cells.push(
                    <div key={`h-col-${col}`} className="drift-cell drift-header">
                        {headers[col - 1]}
                    </div>
                );
                continue;
            }

            if (isHeaderCol) {
                cells.push(
                    <div key={`h-row-${row}`} className="drift-cell drift-header">
                        {headers[row - 1]}
                    </div>
                );
                continue;
            }

            const isSelf = row === col;
            const sensorA = sensorIds[row - 1];
            const sensorB = sensorIds[col - 1];

            const activeDrift = drifts.find(d =>
                (d.sensorA === sensorA && d.sensorB === sensorB) ||
                (d.sensorA === sensorB && d.sensorB === sensorA)
            );

            const opacity = activeDrift && activeDrift.active ? Math.min(0.8, 0.15 + (activeDrift.drift * 2)) : 0;
            const isStrongest = activeDrift && strongestDrift &&
                ((activeDrift.sensorA === strongestDrift.sensorA && activeDrift.sensorB === strongestDrift.sensorB) ||
                    (activeDrift.sensorA === strongestDrift.sensorB && activeDrift.sensorB === strongestDrift.sensorA));

            const classes = ['drift-cell'];
            if (isSelf) classes.push('drift-self');
            else if (activeDrift && activeDrift.active) {
                classes.push('drift-active');
                if (isStrongest) classes.push('drift-strongest');
            }

            cells.push(
                <div
                    key={`${row}-${col}`}
                    className={classes.join(' ')}
                    style={activeDrift && activeDrift.active ? { '--drift-op': opacity } as React.CSSProperties : {}}
                    title={activeDrift && activeDrift.active ? `Correlation: ${activeDrift.correlation.toFixed(2)} | Drift: +${activeDrift.drift.toFixed(3)}` : undefined}
                >
                    {isSelf ? '' : (activeDrift && activeDrift.active ? activeDrift.drift.toFixed(2) : '–')}
                </div>
            );
        }
    }

    return (
        <div className="drift-panel">
            <h2 className="panel-title">Correlation Drift</h2>

            <div className="drift-matrix-wrapper">
                <div className="drift-matrix">
                    {cells}
                </div>
            </div>

            {/* Summary Line */}
            {strongestDrift ? (
                <div className="drift-summary">
                    Strongest drift: <strong>{idToLabel[strongestDrift.sensorA] || strongestDrift.sensorA}</strong> ↔{' '}
                    <strong>{idToLabel[strongestDrift.sensorB] || strongestDrift.sensorB}</strong>{' '}
                    (Δ +{strongestDrift.drift.toFixed(2)})
                </div>
            ) : (
                <div className="drift-summary drift-summary--nom">No anomalous correlation detected</div>
            )}
        </div>
    );
}
