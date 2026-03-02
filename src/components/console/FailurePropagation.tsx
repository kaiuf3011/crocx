
import type { PropagationNode } from '../../hooks/useSimulatedTelemetry';

interface Props {
    nodes: PropagationNode[];
}

const NODE_POSITIONS = [
    { x: 50, y: 50 },
    { x: 150, y: 30 },
    { x: 250, y: 50 },
    { x: 350, y: 30 },
    { x: 450, y: 50 },
];

export default function FailurePropagation({ nodes }: Props) {
    const activeChain = nodes.filter(n => n.active);
    const hasCritical = nodes.some(n => n.severity > 0.7);

    return (
        <div className="propagation-panel">
            <h2 className="panel-title">Failure Propagation</h2>
            <div className="propagation-graph">
                <svg width="100%" height="100" viewBox="0 0 500 100" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <radialGradient id="node-glow-critical" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--cc-red)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="var(--cc-red)" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="node-glow-warning" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--cc-gold)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--cc-gold)" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="pulse-grad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="var(--cc-gold)" stopOpacity="0" />
                            <stop offset="50%" stopColor="var(--cc-gold)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="var(--cc-gold)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Connector lines */}
                    {NODE_POSITIONS.slice(0, -1).map((pos, i) => {
                        const next = NODE_POSITIONS[i + 1];
                        const bothActive = nodes[i]?.active && nodes[i + 1]?.active;
                        return (
                            <g key={`line-${i}`}>
                                <line
                                    x1={pos.x + 20}
                                    y1={pos.y}
                                    x2={next.x - 20}
                                    y2={next.y}
                                    stroke={bothActive ? 'var(--cc-gold)' : 'rgba(255,255,255,0.06)'}
                                    strokeWidth="1.5"
                                    strokeOpacity={bothActive ? 0.5 : 1}
                                />
                                {/* One-shot pulse animation on active connections */}
                                {bothActive && (
                                    <circle r="3" fill="var(--cc-gold)" opacity="0.8">
                                        <animateMotion
                                            dur="1.5s"
                                            repeatCount="1"
                                            path={`M${pos.x + 20},${pos.y} L${next.x - 20},${next.y}`}
                                        />
                                        <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="1" />
                                    </circle>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                        const pos = NODE_POSITIONS[i];
                        const isCrit = node.severity > 0.7;
                        const isWarn = node.active && !isCrit;
                        const nodeColor = isCrit ? 'var(--cc-red)' : isWarn ? 'var(--cc-gold)' : 'rgba(255,255,255,0.1)';

                        return (
                            <g key={node.id}>
                                {/* Glow */}
                                {node.active && (
                                    <circle
                                        cx={pos.x} cy={pos.y} r={28}
                                        fill={isCrit ? 'url(#node-glow-critical)' : 'url(#node-glow-warning)'}
                                    >
                                        {isCrit && (
                                            <animate attributeName="r" values="28;32;28" dur="2s" repeatCount="indefinite" />
                                        )}
                                    </circle>
                                )}
                                {/* Circle */}
                                <circle
                                    cx={pos.x} cy={pos.y} r={18}
                                    fill="rgba(15,15,18,0.9)"
                                    stroke={nodeColor}
                                    strokeWidth={node.active ? 1.5 : 0.8}
                                    style={{ transition: 'stroke 400ms ease, stroke-width 400ms ease' }}
                                />
                                {/* Label */}
                                <text
                                    x={pos.x} y={pos.y + 1}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fill={node.active ? (isCrit ? 'var(--cc-red)' : 'var(--cc-gold)') : 'var(--cc-text-muted)'}
                                    fontSize="8" fontWeight="600"
                                    fontFamily="var(--font-family)"
                                >
                                    {node.label.substring(0, 4).toUpperCase()}
                                </text>
                                <text
                                    x={pos.x} y={pos.y + 30}
                                    textAnchor="middle"
                                    fill="var(--cc-text-muted)" fontSize="7"
                                    fontFamily="var(--font-family)"
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {activeChain.length > 0 && (
                <div className="propagation-chain">
                    <span className="propagation-chain__label">Chain</span>
                    <span className="propagation-chain__path">
                        {activeChain.map(n => n.label).join(' → ')}
                    </span>
                </div>
            )}
        </div>
    );
}
