import { Link } from 'react-router-dom';
import { Leaf, Users, Truck, BarChart3, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function Landing() {
    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8fafc', overflow: 'hidden' }}>

            {/* 1. Hero Section (Gradient Background) */}
            <header
                style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)', // Reverted to Green gradient as requested
                    padding: '6rem 2rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}
            >
                <div style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Leaf size={48} color="#34d399" />
                </div>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', maxWidth: '800px', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                    EcoShare Food Security Platform
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', maxWidth: '650px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
                    A comprehensive platform for connecting food donors, recipient organizations, and data analysts to track and reduce food waste globally.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link
                        to="/login"
                        state={{ isSignUp: true }}
                        style={{
                            background: 'white',
                            color: '#064e3b', /* Match the dark green gradient for text on the white button */
                            padding: '0.875rem 2.5rem',
                            borderRadius: '99px', // Pill shape for modern look
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Users size={18} style={{ marginRight: '0.5rem' }} /> Get Started
                    </Link>
                    <Link
                        to="/login"
                        state={{ isSignUp: false }}
                        style={{
                            background: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.5)',
                            padding: '0.75rem 2rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center'
                        }}
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            {/* 2. Features Section (2x2 Grid) */}
            <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Powerful Features</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Everything you need to effortlessly manage surplus food donations and track community impact.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Feature 1 */}
                    <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <Truck size={36} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 600 }}>Seamless Logistics</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Donors easily list available surplus, and recipient organizations can quickly claim and coordinate pickup times.
                        </p>
                    </div>
                    {/* Feature 2 */}
                    <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <HeartHandshake size={36} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 600 }}>Community Driven</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Built specifically to foster relationships between local businesses and food security initiatives.
                        </p>
                    </div>
                    {/* Feature 3 */}
                    <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <BarChart3 size={36} color="#a855f7" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 600 }}>Live Analytics</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Dedicated portals for Data Analysts to track CO2 emissions avoided and meals provided in real-time.
                        </p>
                    </div>
                    {/* Feature 4 */}
                    <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <ShieldCheck size={36} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#0f172a', fontWeight: 600 }}>Secure Platform</h3>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            All organizations are vetted securely with proper authorization controls and role-based access.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. How It Works Section */}
            <section style={{ padding: '5rem 2rem', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b' }}>How It Works</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Step 1 */}
                    <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem auto' }}>
                            1
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Create Profile</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '250px' }}>Join the platform as a Donor, Recipient, or Analyst.</p>
                    </div>
                    {/* Step 2 */}
                    <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem auto' }}>
                            2
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Share & Rescue</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '250px' }}>List massive surplus items or actively claim donations nearing expiry.</p>
                    </div>
                    {/* Step 3 */}
                    <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem auto' }}>
                            3
                        </div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Measure Impact</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '250px' }}>View unified analytics reporting on total environmental impact.</p>
                    </div>
                </div>
            </section>

            {/* 4. Footer */}
            <footer style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '2rem', textAlign: 'center', marginTop: 'auto' }}>
                <p style={{ fontSize: '0.875rem' }}>&copy; 2026 EcoShare Food Security Platform. All rights reserved.</p>
            </footer>
        </div>
    );
}
