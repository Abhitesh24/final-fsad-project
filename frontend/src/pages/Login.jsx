import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Leaf, Users, Truck, BarChart3, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function Login() {
    const location = useLocation();
    const navigate = useNavigate();

    const initialIsSignUp = location.state?.isSignUp ?? false;

    const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
    const [activeRole, setActiveRole] = useState('donor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');

    const [captchaString, setCaptchaString] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaError, setCaptchaError] = useState('');
    const canvasRef = React.useRef(null);

    const generateCaptcha = () => {
        const chars = 'abcdfhjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaString(result);
        setCaptchaInput('');
    };

    useEffect(() => {
        if (!captchaString || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < captchaString.length; i++) {
            ctx.font = `bold ${Math.floor(Math.random() * 8 + 26)}px "Comic Sans MS", sans-serif`;
            ctx.fillStyle = ['#f43f5e', '#fb7185', '#e11d48'][Math.floor(Math.random() * 3)];
            ctx.save();
            ctx.translate(15 + i * 22, 35 + Math.random() * 6 - 3);
            ctx.rotate((Math.random() - 0.5) * 0.5);
            ctx.fillText(captchaString[i], 0, 0);
            ctx.restore();
        }
        
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
    }, [captchaString]);

    const roles = [
        { id: 'donor', label: 'Donor', icon: <Leaf size={18} />, color: '#10b981' },
        { id: 'recipient', label: 'Recipient', icon: <Truck size={18} />, color: '#3b82f6' },
        { id: 'analyst', label: 'Analyst', icon: <BarChart3 size={18} />, color: '#a855f7' },
        { id: 'admin', label: 'Admin', icon: <Users size={18} />, color: '#f97316' }
    ];

    const activeConfig = roles.find(r => r.id === activeRole);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCaptchaError('');

        if (captchaInput.toLowerCase() !== captchaString.toLowerCase()) {
            setCaptchaError('Incorrect verification code. Please try again.');
            generateCaptcha();
            return;
        }

        try {
            const type = activeConfig.label;
            
            if (isSignUp && activeRole !== 'admin') {
                const res = await axios.post('http://localhost:3001/api/auth/register', {
                    email,
                    password,
                    name: orgName,
                    type
                });
                
                localStorage.setItem('ecoshare_token', res.data.token);
                localStorage.setItem('ecoshare_current_user', JSON.stringify(res.data.user));
                navigate(`/dashboard/${activeRole}`);
            } else {
                const res = await axios.post('http://localhost:3001/api/auth/login', {
                    email,
                    password,
                    type
                });
                
                localStorage.setItem('ecoshare_token', res.data.token);
                localStorage.setItem('ecoshare_current_user', JSON.stringify(res.data.user));
                navigate(`/dashboard/${activeRole}`);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred during authentication.');
            generateCaptcha();
        }
    };

    useEffect(() => {
        if (activeRole === 'admin') {
            setIsSignUp(false);
        }
        generateCaptcha();
    }, [activeRole, isSignUp]);

    return (
        <div
            className="min-h-screen w-full relative flex flex-col"
            style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', // Very subtle light slate gradient
            }}
        >
            {/* Top Navigation Bar */}
            <div style={{ padding: '2rem 3rem', display: 'flex', justifyContent: 'flex-start' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '1.1rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#0f172a'} onMouseOut={(e) => e.target.style.color = '#64748b'}>
                    <ArrowLeft size={24} />
                    Back to Platform Overview
                </Link>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div
                    className="animate-fade-in w-full max-w-2xl flex flex-col gap-10"
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: `${activeConfig.color}15`, marginBottom: '2rem', border: `1px solid ${activeConfig.color}30` }}>
                            <div style={{ transform: 'scale(1.5)', color: activeConfig.color, display: 'flex' }}>
                                {activeConfig.icon}
                            </div>
                        </div>
                        <h2 style={{ fontSize: '3.5rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                            {activeRole === 'admin' ? 'Platform Administration' : (isSignUp ? 'Join the Network' : 'Welcome Back')}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '1.25rem', maxWidth: '500px', margin: '0 auto' }}>
                            {activeRole === 'admin' ? 'Securely sign in to access the central platform control center and moderate operations.' : (isSignUp ? 'Create your profile to start making an impact in global food security.' : 'Sign in to access your dedicated platform dashboard and analytics.')}
                        </p>
                    </div>

                    {/* Role Tabs */}
                    <div style={{
                        display: 'flex',
                        background: '#f8fafc',
                        padding: '0.5rem',
                        borderRadius: '1rem',
                        gap: '0.5rem',
                        border: '1px solid #e2e8f0',
                        maxWidth: '600px',
                        width: '100%',
                        margin: '0 auto'
                    }}>
                        {roles.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setActiveRole(r.id)}
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 0.25rem',
                                    borderRadius: '0.5rem',
                                    color: activeRole === r.id ? activeConfig.color : '#64748b',
                                    backgroundColor: activeRole === r.id ? 'white' : 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    transition: 'all 0.2s',
                                    border: `1px solid ${activeRole === r.id ? 'rgba(226, 232, 240, 1)' : 'transparent'}`,
                                    boxShadow: activeRole === r.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ color: activeRole === r.id ? r.color : 'inherit' }}>
                                    {r.icon}
                                </span>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-4" style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                        {error && (
                            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.3s' }}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                {error}
                            </div>
                        )}

                        {isSignUp && activeRole !== 'admin' && (
                            <div className="flex flex-col gap-1.5 animate-fade-in">
                                <label htmlFor="orgName" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Organization Name</label>
                                <input
                                    id="orgName"
                                    type="text"
                                    className="input"
                                    placeholder="e.g. City Food Bank"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: 'white',
                                        border: '1px solid #cbd5e1',
                                        color: '#0f172a',
                                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Work Email</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="name@organization.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'white',
                                    border: '1px solid #cbd5e1',
                                    color: '#0f172a',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                    borderRadius: '0.5rem'
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Password</label>
                                {!isSignUp && (
                                    <button
                                        type="button"
                                        onClick={() => alert("A password reset link has been sent to your email address.")}
                                        style={{ fontSize: '0.75rem', color: activeConfig.color, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        padding: '0.75rem 1rem',
                                        paddingRight: '2.5rem',
                                        width: '100%',
                                        background: 'white',
                                        border: '1px solid #cbd5e1',
                                        color: '#0f172a',
                                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                                <button
                                    type="button"
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Visual Image CAPTCHA Field */}
                        <div className="flex flex-col gap-1.5" style={{ padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                            <div className="flex items-center gap-4">
                                <canvas
                                    ref={canvasRef}
                                    width="160"
                                    height="50"
                                    style={{ borderRadius: '0.25rem', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    onClick={generateCaptcha}
                                    title="Click to refresh CAPTCHA"
                                />
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Click image to refresh</div>
                            </div>
                            <input
                                id="captcha"
                                type="text"
                                className="input"
                                placeholder="Enter verification Code"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                required
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'white',
                                    border: captchaError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                    color: '#0f172a',
                                    borderRadius: '0.5rem',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            />
                            {captchaError && <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{captchaError}</div>}
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            style={{
                                backgroundColor: activeConfig.color,
                                color: 'white',
                                width: '100%',
                                padding: '0.875rem',
                                fontSize: '1rem',
                                marginTop: '0.5rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 14px 0 ${activeConfig.color}40`,
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {isSignUp ? `Create ${activeConfig.label} Account` : `Sign In to ${activeConfig.label} Portal`}
                        </button>
                    </form>

                    {activeRole !== 'admin' && (
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {isSignUp ? (
                                <>Already have an account? <button onClick={() => setIsSignUp(false)} style={{ color: activeConfig.color, fontWeight: 700, marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>Sign In</button></>
                            ) : (
                                <>Don't have an account yet? <button onClick={() => setIsSignUp(true)} style={{ color: activeConfig.color, fontWeight: 700, marginLeft: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>Create Account</button></>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
