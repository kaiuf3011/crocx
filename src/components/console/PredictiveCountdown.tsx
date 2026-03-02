import type { SlopeTTC } from '../../hooks/useSimulatedTelemetry';
import { Zap } from 'lucide-react';

interface Props {
    timeToCritical: number; // seconds (legacy fallback)
    riskScore: number;
    slopeTTC: SlopeTTC | null;
}

function formatTime(seconds: number): { h: string; m: string; s: string } {
    const totalSec = Math.max(0, Math.floor(seconds));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return {
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
    };
}

export default function PredictiveCountdown({ timeToCritical, riskScore, slopeTTC }: Props) {
    // Use slope-based TTC if available, otherwise fall back to legacy
    const effectiveTTC = slopeTTC ? slopeTTC.estimatedSeconds : timeToCritical;
    const time = formatTime(effectiveTTC);
    const hasSlopeTTC = slopeTTC !== null;

    // Determine threshold glow
    const threshold = hasSlopeTTC
        ? (slopeTTC!.estimatedSeconds < 300 ? 'red' : slopeTTC!.estimatedSeconds < 600 ? 'gold' : 'none')
        : (riskScore > 25 ? 'gold' : 'none');

    return (
        <div className="countdown-panel cc-glass">
            <h2 className="panel-title">
                {hasSlopeTTC ? 'Predictive Time to Critical' : 'Time to Critical'}
            </h2>

            {/* Slope annotation */}
            {hasSlopeTTC && (
                <div className="countdown-slope-info">
                    <span className="countdown-slope-sensor">{slopeTTC!.sensorLabel}</span>
                    <span className="countdown-slope-rate">
                        {slopeTTC!.rate > 0 ? '+' : ''}{slopeTTC!.rate} {slopeTTC!.unit}/min
                    </span>
                    <span className="countdown-slope-range">
                        {slopeTTC!.current}{slopeTTC!.unit} → {slopeTTC!.threshold}{slopeTTC!.unit}
                    </span>
                </div>
            )}

            <div
                className="countdown-display"
                data-threshold={threshold}
            >
                <div className="countdown-segment">
                    <span className="countdown-digit">{time.h}</span>
                    <span className="countdown-label">HRS</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-segment">
                    <span className="countdown-digit">{time.m}</span>
                    <span className="countdown-label">MIN</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-segment">
                    <span className="countdown-digit">{time.s}</span>
                    <span className="countdown-label">SEC</span>
                </div>
            </div>

            {/* Method indicator */}
            <div className="countdown-method">
                {hasSlopeTTC ? (
                    <span className="countdown-method__tag countdown-method__tag--slope" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} /> SLOPE COMPUTED
                    </span>
                ) : (
                    <span className="countdown-method__tag countdown-method__tag--static">STATIC ESTIMATE</span>
                )}
            </div>
        </div>
    );
}
