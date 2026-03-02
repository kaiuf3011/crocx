import React, { useEffect, useRef } from 'react';
import type { IncidentEvent } from '../../hooks/useSimulatedTelemetry';

interface Props {
    events: IncidentEvent[];
}

function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const IncidentTimeline: React.FC<Props> = React.memo(({ events }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new events arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events.length]);

    return (
        <div className="incident-timeline">
            <h3 className="panel-title">Incident Timeline</h3>

            {events.length === 0 ? (
                <div className="incident-timeline__empty">
                    <span className="incident-timeline__idle-dot" />
                    <span>No incidents recorded</span>
                </div>
            ) : (
                <div className="incident-timeline__scroll" ref={scrollRef}>
                    <div className="incident-timeline__line" />
                    {events.map(event => (
                        <div
                            key={event.id}
                            className={`incident-timeline__event incident-timeline__event--${event.severity}`}
                        >
                            <div className="incident-timeline__dot-wrap">
                                <span className={`incident-timeline__dot incident-timeline__dot--${event.severity}`} />
                            </div>
                            <div className="incident-timeline__content">
                                <span className="incident-timeline__time">{formatTimestamp(event.timestamp)}</span>
                                <span className="incident-timeline__msg">{event.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

IncidentTimeline.displayName = 'IncidentTimeline';
export default IncidentTimeline;
