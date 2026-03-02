import { useState, useMemo, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './Login.css';

function LoginCar() {
    const { scene } = useGLTF('/porsche-opt.glb');
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    return (
        <group rotation={[0, Math.PI * 0.85, 0]}>
            <primitive object={clonedScene} scale={1} position={[0, 0, 0]} />
        </group>
    );
}

useGLTF.preload('/porsche-opt.glb');

export default function Login() {
    const navigate = useNavigate();
    const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'success'>('idle');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginState('authenticating');

        // Simulate authentication delay
        setTimeout(() => {
            setLoginState('success');
            setTimeout(() => {
                navigate('/console');
            }, 600);
        }, 1500);
    };

    return (
        <div className="login-container">
            {/* 3D Car Background */}
            <div className="login-3d-bg">
                <Canvas
                    camera={{ position: [4, 1.5, 4], fov: 34 }}
                    style={{ background: 'transparent', width: '100%', height: '100%' }}
                    gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                    dpr={[1, 1.5]}
                    frameloop="demand"
                >
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 5, 5]} intensity={0.6} />
                    <directionalLight position={[-3, 2, -3]} intensity={0.2} color="#AF924D" />
                    <Suspense fallback={null}>
                        <LoginCar />
                    </Suspense>
                    <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
                </Canvas>
            </div>

            {/* Ambient Background Layer */}
            <div className="login-ambient" />

            <div className={`login-panel cc-glass-a ${loginState !== 'idle' ? 'login-panel--locked' : ''}`}>
                <Link to="/" className="login-back-link">
                    <ArrowLeft size={14} />
                    <span>Back to Home</span>
                </Link>
                <div className="login-header">
                    <div className="login-logo">◆</div>
                    <h1 className="login-title">CROC<span className="login-title-accent">X</span></h1>
                    <div className="login-subtitle">SECURE COMMAND UPLINK</div>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Operator ID</label>
                        <input
                            type="text"
                            className="login-input"
                            defaultValue="SysAdmin_A9"
                            disabled={loginState !== 'idle'}
                            spellCheck="false"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Authorization Cipher</label>
                        <input
                            type="password"
                            className="login-input"
                            defaultValue="••••••••••••"
                            disabled={loginState !== 'idle'}
                        />
                    </div>

                    <button
                        type="submit"
                        className={`login-btn ${loginState === 'success' ? 'login-btn--success' : ''}`}
                        disabled={loginState !== 'idle'}
                    >
                        {loginState === 'idle' && 'INITIALIZE HANDSHAKE'}
                        {loginState === 'authenticating' && 'VERIFYING CREDENTIALS...'}
                        {loginState === 'success' && 'ACCESS GRANTED'}
                    </button>

                    <button
                        type="button"
                        className="login-demo-btn"
                        onClick={handleLogin}
                        disabled={loginState !== 'idle'}
                    >
                        Quick Access (Demo)
                    </button>
                </form>

                <div className="login-footer">
                    <span>CONNECTION: SECURE</span>
                    <span className="login-status-dot" data-active={loginState === 'success' ? "true" : "false"} />
                </div>
            </div>
        </div>
    );
}
