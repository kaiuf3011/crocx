import { useRef, useMemo, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SensorReading, ActiveFault } from '../../hooks/useSimulatedTelemetry';

/* =========================================================
   Digital Twin State System
   ========================================================= */
type SubsystemStatus = 'normal' | 'warning' | 'critical';

interface SubsystemState {
    id: string;
    label: string;
    status: SubsystemStatus;
    severity: number;       // 0–1
    position: [number, number, number];
    sensorIds: string[];
    riskContribution: number; // percentage
}

const STATE_COLORS = {
    normal: { emissive: new THREE.Color('#000000'), intensity: 0, ambient: '#FFFFFF' },
    warning: { emissive: new THREE.Color('#AF924D'), intensity: 0.6, ambient: '#AF924D' },
    critical: { emissive: new THREE.Color('#B83B3B'), intensity: 1.2, ambient: '#B83B3B' },
};

/* =========================================================
   Subsystem Definitions
   ========================================================= */
const SUBSYSTEM_DEFS = [
    { id: 'engine', label: 'Engine', position: [0, 0.55, 1.2] as [number, number, number], sensorIds: ['eng_temp', 'exh_temp'], radius: 0.45 },
    { id: 'battery', label: 'Battery', position: [0, 0.45, -0.5] as [number, number, number], sensorIds: ['bat_volt'], radius: 0.35 },
    { id: 'tire_fl', label: 'Tires', position: [0.8, 0.25, 0.8] as [number, number, number], sensorIds: ['vib_rms'], radius: 0.3 },
    { id: 'cooling', label: 'Cooling', position: [-0.4, 0.65, 0.8] as [number, number, number], sensorIds: ['cool_flow'], radius: 0.35 },
    { id: 'transmission', label: 'Transmission', position: [0, 0.4, -1.0] as [number, number, number], sensorIds: ['trans_temp'], radius: 0.35 },
    { id: 'oil', label: 'Oil System', position: [0.5, 0.55, 0.5] as [number, number, number], sensorIds: ['oil_pres'], radius: 0.3 },
];

const SENSOR_DEFS: Record<string, { nominal: number; range: number; unit: string }> = {
    eng_temp: { nominal: 92, range: 70, unit: '°C' },
    oil_pres: { nominal: 350, range: 350, unit: 'kPa' },
    bat_volt: { nominal: 13.2, range: 3.8, unit: 'V' },
    vib_rms: { nominal: 3.5, range: 15, unit: 'mm/s' },
    cool_flow: { nominal: 7.5, range: 10, unit: 'L/m' },
    exh_temp: { nominal: 450, range: 700, unit: '°C' },
    trans_temp: { nominal: 85, range: 80, unit: '°C' },
};

/* Cascade map: when source goes critical, connected subsystems light amber */
const CASCADE_MAP: Record<string, string[]> = {
    engine: ['cooling', 'oil'],
    cooling: ['engine', 'transmission'],
    battery: ['transmission'],
    transmission: ['engine'],
    oil: ['engine'],
};

function computeSeverity(sensors: SensorReading[], sensorIds: string[]): number {
    let maxSev = 0;
    for (const id of sensorIds) {
        const s = sensors.find(sen => sen.id === id);
        if (!s) continue;
        const def = SENSOR_DEFS[id];
        if (!def) continue;
        const dev = Math.abs(s.value - def.nominal) / def.range;
        const sev = dev > 0.25 ? Math.min((dev - 0.25) / 0.35, 1) : 0;
        if (sev > maxSev) maxSev = sev;
    }
    return maxSev;
}

function computeSubsystemStates(sensors: SensorReading[]): SubsystemState[] {
    // First pass: compute raw severities
    const raw = SUBSYSTEM_DEFS.map(def => ({
        ...def,
        severity: computeSeverity(sensors, def.sensorIds),
    }));

    // Second pass: cascade (if a subsystem is critical, connected ones get at least warning)
    const states = raw.map(sub => {
        let severity = sub.severity;
        // Check if any connected subsystem is critical → boost this one
        for (const [sourceId, targets] of Object.entries(CASCADE_MAP)) {
            if (targets.includes(sub.id)) {
                const source = raw.find(s => s.id === sourceId);
                if (source && source.severity > 0.6) {
                    severity = Math.max(severity, 0.25); // minimum warning for cascade
                }
            }
        }

        const status: SubsystemStatus = severity > 0.6 ? 'critical' : severity > 0.2 ? 'warning' : 'normal';
        const totalSev = raw.reduce((s, r) => s + r.severity, 0);
        const riskContribution = totalSev > 0 ? Math.round((sub.severity / totalSev) * 100) : 0;

        return { ...sub, severity, status, riskContribution };
    });

    return states;
}

/* =========================================================
   Subsystem Zone — Interactive proxy mesh with smooth glow
   ========================================================= */
function SubsystemZone({ state, isHovered, onHover, onUnhover }: {
    state: SubsystemState;
    isHovered: boolean;
    onHover: () => void;
    onUnhover: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const def = SUBSYSTEM_DEFS.find(d => d.id === state.id)!;

    const targetColor = STATE_COLORS[state.status].emissive;
    const targetIntensity = STATE_COLORS[state.status].intensity;

    useFrame(({ clock }) => {
        if (!matRef.current) return;

        // Smooth emissive lerp (Step 3)
        matRef.current.emissive.lerp(targetColor, 0.08);
        const baseIntensity = THREE.MathUtils.lerp(
            matRef.current.emissiveIntensity,
            targetIntensity,
            0.08
        );

        // Risk-synchronized pulse for critical (Step 8)
        if (state.status === 'critical') {
            const pulse = Math.sin(clock.elapsedTime * 2.5) * 0.15;
            matRef.current.emissiveIntensity = baseIntensity + pulse;
        } else {
            matRef.current.emissiveIntensity = baseIntensity;
        }

        // Opacity
        const targetOpacity = state.status === 'normal'
            ? (isHovered ? 0.08 : 0)
            : Math.min(state.severity * 0.25, 0.2);
        matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.1);

        // Hover scale (Step 4)
        if (meshRef.current) {
            const targetScale = isHovered ? 1.04 : 1.0;
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.12
            );
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={state.position}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(); }}
            onPointerOut={onUnhover}
        >
            <sphereGeometry args={[def.radius, 16, 16]} />
            <meshStandardMaterial
                ref={matRef}
                color={state.status === 'critical' ? '#B83B3B' : state.status === 'warning' ? '#AF924D' : '#FFFFFF'}
                emissive="#000000"
                emissiveIntensity={0}
                transparent
                opacity={0}
                depthWrite={false}
                roughness={0.6}
                metalness={0.2}
            />
        </mesh>
    );
}

/* =========================================================
   Cascade Connection Lines (Step 6)
   ========================================================= */
function CascadeLine({ from, to, intensity }: {
    from: [number, number, number];
    to: [number, number, number];
    intensity: number;
}) {
    const lineRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);

    const { midpoint, length, rotation } = useMemo(() => {
        const start = new THREE.Vector3(...from);
        const end = new THREE.Vector3(...to);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(start);
        const len = dir.length();
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        const euler = new THREE.Euler().setFromQuaternion(q);
        return { midpoint: mid, length: len, rotation: euler };
    }, [from, to]);

    useFrame(() => {
        if (!matRef.current) return;
        matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, intensity * 0.4, 0.08);
        matRef.current.emissiveIntensity = THREE.MathUtils.lerp(matRef.current.emissiveIntensity, intensity * 0.6, 0.08);
    });

    return (
        <mesh ref={lineRef} position={midpoint} rotation={rotation}>
            <cylinderGeometry args={[0.008, 0.008, length, 4]} />
            <meshStandardMaterial
                ref={matRef}
                color="#AF924D"
                emissive="#AF924D"
                emissiveIntensity={0}
                transparent
                opacity={0}
                depthWrite={false}
            />
        </mesh>
    );
}

/* =========================================================
   Hover Tooltip Panel (Step 4 + Step 10)
   ========================================================= */
function HoverTooltip({ state, sensors }: { state: SubsystemState; sensors: SensorReading[] }) {
    const pos: [number, number, number] = [
        state.position[0],
        state.position[1] + 0.5,
        state.position[2],
    ];

    const statusColor = state.status === 'critical' ? '#B83B3B' : state.status === 'warning' ? '#AF924D' : '#59735E';
    const statusText = state.status.toUpperCase();

    return (
        <Html position={pos} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
            <div style={{
                background: 'rgba(14,14,16,0.92)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${statusColor}`,
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 140,
                fontFamily: "'Inter', sans-serif",
                userSelect: 'none',
                boxShadow: `0 0 20px rgba(0,0,0,0.4), 0 0 8px ${statusColor}33`,
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                    borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6,
                }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: statusColor,
                        boxShadow: state.status !== 'normal' ? `0 0 8px ${statusColor}` : 'none',
                        animation: state.status === 'critical' ? 'hud-pulse 1.2s infinite' : 'none',
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', color: '#EAEAEA' }}>
                        {state.label}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: statusColor, marginLeft: 'auto' }}>
                        {statusText}
                    </span>
                </div>

                {/* Sensor Readings */}
                {state.sensorIds.map(id => {
                    const s = sensors.find(sen => sen.id === id);
                    if (!s) return null;
                    const def = SENSOR_DEFS[id];
                    return (
                        <div key={id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 3,
                        }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                {s.label}
                            </span>
                            <span style={{
                                fontSize: 13, fontWeight: 600,
                                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                                color: s.status === 'critical' ? '#B83B3B' : s.status === 'warning' ? '#AF924D' : '#EAEAEA',
                            }}>
                                {s.value.toFixed(1)}
                                <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>{def?.unit}</span>
                            </span>
                        </div>
                    );
                })}

                {/* Deviation + Risk Contribution */}
                <div style={{
                    marginTop: 8, paddingTop: 6,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between',
                }}>
                    {state.sensorIds.map(id => {
                        const s = sensors.find(sen => sen.id === id);
                        if (!s) return null;
                        const def = SENSOR_DEFS[id];
                        const deviation = def ? Math.round(((s.value - def.nominal) / def.nominal) * 100) : 0;
                        return (
                            <span key={id} style={{
                                fontSize: 10, color: deviation > 15 ? '#B83B3B' : deviation > 5 ? '#AF924D' : 'rgba(255,255,255,0.4)',
                            }}>
                                Deviation: {deviation > 0 ? '+' : ''}{deviation}%
                            </span>
                        );
                    })}
                </div>
                <div style={{ marginTop: 4 }}>
                    <span style={{
                        fontSize: 10,
                        color: state.riskContribution > 40 ? '#B83B3B' : state.riskContribution > 15 ? '#AF924D' : 'rgba(255,255,255,0.4)',
                    }}>
                        Risk Contribution: {state.riskContribution}%
                    </span>
                </div>
            </div>
        </Html>
    );
}

/* =========================================================
   Porsche Model — Material quality upgrade (Step 9)
   ========================================================= */
function PorscheModel({ sensors, subsystemStates, hoveredId, onHover, onUnhover }: {
    sensors: SensorReading[];
    subsystemStates: SubsystemState[];
    hoveredId: string | null;
    onHover: (id: string) => void;
    onUnhover: () => void;
}) {
    const { scene } = useGLTF('/porsche-opt.glb');
    const modelRef = useRef<THREE.Group>(null);

    const clonedScene = useMemo(() => {
        const clone = scene.clone(true);
        clone.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = (child.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                // Step 9: Material quality
                if (mat.roughness !== undefined) {
                    mat.roughness = Math.max(mat.roughness, 0.5);
                    mat.metalness = Math.min(mat.metalness, 0.3);
                }
                child.material = mat;
                child.castShadow = false; // performance
                child.receiveShadow = false;
            }
        });
        return clone;
    }, [scene]);

    // Slow idle rotation (Step 5)
    useFrame(({ clock }) => {
        if (modelRef.current) {
            modelRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.08 + Math.PI;
        }
    });

    // Compute cascade lines
    const cascadeLines = useMemo(() => {
        const lines: { from: [number, number, number]; to: [number, number, number]; intensity: number }[] = [];
        for (const state of subsystemStates) {
            if (state.severity > 0.6) {
                const targets = CASCADE_MAP[state.id] || [];
                for (const targetId of targets) {
                    const target = subsystemStates.find(s => s.id === targetId);
                    if (target) {
                        lines.push({
                            from: state.position,
                            to: target.position,
                            intensity: state.severity,
                        });
                    }
                }
            }
        }
        return lines;
    }, [subsystemStates]);

    return (
        <group ref={modelRef}>
            <primitive object={clonedScene} scale={1} position={[0, 0, 0]} />

            {/* Subsystem zones — interactive proxy meshes */}
            {subsystemStates.map(state => (
                <SubsystemZone
                    key={state.id}
                    state={state}
                    isHovered={hoveredId === state.id}
                    onHover={() => onHover(state.id)}
                    onUnhover={onUnhover}
                />
            ))}

            {/* Cascade connection lines (Step 6) */}
            {cascadeLines.map((line, i) => (
                <CascadeLine key={i} from={line.from} to={line.to} intensity={line.intensity} />
            ))}

            {/* Hover tooltip (Step 4 + Step 10) */}
            {hoveredId && (() => {
                const state = subsystemStates.find(s => s.id === hoveredId);
                if (!state) return null;
                return <HoverTooltip state={state} sensors={sensors} />;
            })()}
        </group>
    );
}

/* =========================================================
   Ambient Light Controller (Step 7)
   ========================================================= */
function AmbientLightController({ maxSeverity }: { maxSeverity: number }) {
    const lightRef = useRef<THREE.AmbientLight>(null);
    const tintLightRef = useRef<THREE.PointLight>(null);

    useFrame(() => {
        if (!lightRef.current) return;
        // Normal: neutral white, Critical: slight red tint
        const baseIntensity = 0.5;
        lightRef.current.intensity = THREE.MathUtils.lerp(
            lightRef.current.intensity,
            baseIntensity,
            0.05
        );

        if (tintLightRef.current) {
            const tintIntensity = maxSeverity > 0.6 ? 0.08 * maxSeverity : 0;
            tintLightRef.current.intensity = THREE.MathUtils.lerp(
                tintLightRef.current.intensity,
                tintIntensity,
                0.05
            );
        }
    });

    return (
        <>
            <ambientLight ref={lightRef} intensity={0.5} />
            <pointLight ref={tintLightRef} position={[0, 3, 0]} intensity={0} color="#B83B3B" />
        </>
    );
}

/* =========================================================
   Camera Rig (Step 5)
   ========================================================= */
function CameraRig() {
    const { camera } = useThree();
    useFrame(() => {
        camera.lookAt(0, 0.4, 0);
    });
    return null;
}

/* =========================================================
   Main Component
   ========================================================= */
interface Props {
    sensors: SensorReading[];
    activeFaults?: ActiveFault[];
    compact?: boolean;
}

export default function DigitalTwin3D({ sensors, activeFaults = [], compact = false }: Props) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleHover = useCallback((id: string) => setHoveredId(id), []);
    const handleUnhover = useCallback(() => setHoveredId(null), []);

    // Compute subsystem states from sensor data
    const subsystemStates = useMemo(() => computeSubsystemStates(sensors), [sensors]);
    const maxSeverity = useMemo(() => Math.max(...subsystemStates.map(s => s.severity)), [subsystemStates]);

    const faultCount = activeFaults.length;
    const criticalSensors = sensors.filter(s => s.status === 'critical').length;
    const warningSensors = sensors.filter(s => s.status === 'warning').length;

    return (
        <div className={`digital-twin-container ${compact ? 'digital-twin--compact' : ''}`}>
            {/* Status bar */}
            {!compact && (
                <div className="twin-status-bar">
                    <div className="twin-status-item">
                        <span className="twin-status-dot" style={{ background: criticalSensors > 0 ? '#B83B3B' : warningSensors > 0 ? '#AF924D' : '#59735E' }} />
                        <span>{criticalSensors > 0 ? 'FAULT ACTIVE' : warningSensors > 0 ? 'ANOMALY DETECTED' : 'ALL SYSTEMS NOMINAL'}</span>
                    </div>
                    <div className="twin-status-right">
                        {faultCount > 0 && (
                            <span className="twin-fault-count">{faultCount} INJECTED</span>
                        )}
                        <span className="twin-status-meta">{sensors.length} SENSORS</span>
                    </div>
                </div>
            )}

            <Canvas
                camera={{ position: [3.5, 2, 3], fov: compact ? 45 : 38 }}
                style={{ background: 'transparent', cursor: hoveredId ? 'pointer' : 'grab' }}
                gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                dpr={[1, 1.5]}
                onCreated={() => setIsLoaded(true)}
            >
                {/* Lighting (Step 7) */}
                <AmbientLightController maxSeverity={maxSeverity} />
                <directionalLight position={[5, 8, 5]} intensity={0.8} color="#FFFFFF" />
                <directionalLight position={[-3, 4, -3]} intensity={0.25} color="#AF924D" />

                <Suspense fallback={null}>
                    {/* Model with subsystem zones */}
                    <PorscheModel
                        sensors={sensors}
                        subsystemStates={subsystemStates}
                        hoveredId={hoveredId}
                        onHover={handleHover}
                        onUnhover={handleUnhover}
                    />
                </Suspense>

                {/* Ground Plane */}
                <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#111113" transparent opacity={0.2} />
                </mesh>

                <CameraRig />
                {/* Step 5: Controlled orbit */}
                <OrbitControls
                    enableZoom={!compact}
                    enablePan={false}
                    enableDamping={true}
                    dampingFactor={0.08}
                    rotateSpeed={0.4}
                    minPolarAngle={0.3}
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={2.5}
                    maxDistance={6}
                />
            </Canvas>

            {!isLoaded && (
                <div className="twin-loading-overlay">
                    <span>Loading Digital Twin…</span>
                </div>
            )}

            {/* Legend */}
            {!compact && (
                <div className="twin-legend">
                    <div className="twin-legend__item">
                        <span className="twin-legend__dot" style={{ background: '#59735E' }} />
                        <span>Nominal</span>
                    </div>
                    <div className="twin-legend__item">
                        <span className="twin-legend__dot" style={{ background: '#AF924D' }} />
                        <span>Warning</span>
                    </div>
                    <div className="twin-legend__item">
                        <span className="twin-legend__dot" style={{ background: '#B83B3B' }} />
                        <span>Critical</span>
                    </div>
                </div>
            )}

            {/* Hovered subsystem info panel */}
            {hoveredId && !compact && (() => {
                const state = subsystemStates.find(s => s.id === hoveredId);
                if (!state) return null;
                const statusColor = state.status === 'critical' ? '#B83B3B' : state.status === 'warning' ? '#AF924D' : '#59735E';
                return (
                    <div className="twin-info-panel">
                        <div className="twin-info-panel__header">
                            <span className="twin-info-panel__dot" style={{ background: statusColor }} />
                            <span className="twin-info-panel__name">{state.label}</span>
                            <span className="twin-info-panel__status" style={{ color: statusColor }}>{state.status.toUpperCase()}</span>
                        </div>
                        <div className="twin-info-panel__contribution">
                            This component is contributing {state.riskContribution}% of current risk escalation.
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

useGLTF.preload('/porsche-opt.glb');
