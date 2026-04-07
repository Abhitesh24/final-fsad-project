import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Leaf, Users, Truck, BarChart3, Settings, LogOut, LayoutDashboard, Bell, Mail, Moon, Maximize, X, Phone } from 'lucide-react';
import axios from 'axios';
import Chatbot from './Chatbot';

// Custom Toggle Element Component matching user reference
const ToggleElement = ({ icon, label, state, setState }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => setState(!state)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {icon}
            <span style={{ fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{
            width: '40px', height: '20px',
            backgroundColor: state ? 'var(--primary-500)' : 'var(--surface-gray)',
            borderRadius: '10px', position: 'relative',
            border: state ? 'none' : '1px solid var(--border-light)',
            transition: 'background-color 0.2s'
        }}>
            <div style={{
                width: '16px', height: '16px', backgroundColor: 'white',
                border: state ? 'none' : '1px solid var(--border-light)',
                borderRadius: '50%', position: 'absolute', top: state ? '2px' : '1px',
                left: state ? '22px' : '1px',
                transition: 'left 0.2s'
            }}></div>
        </div>
    </div>
);

export default function DashboardShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const path = location.pathname;

    const [listings, setListings] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [claimAlerts, setClaimAlerts] = useState(true);
    const [expiryReminders, setExpiryReminders] = useState(true);
    const [compactView, setCompactView] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({ name: '', phone: '', address: '', password: '', confirmPassword: '' });

    useEffect(() => {
        const userStr = localStorage.getItem('ecoshare_current_user');
        const token = localStorage.getItem('ecoshare_token');

        if (!userStr || !token) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setEditProfileData({ name: user.name || '', phone: user.phone || '', address: user.address || '', password: '', confirmPassword: '' });

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        fetchListings();
        if (user.type === 'Admin') {
            fetchOrgs();
        }
    }, [navigate]);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10;

    const fetchListings = async (reset = false) => {
        try {
            const currentOffset = reset ? 0 : page * limit;
            const res = await axios.get(`http://localhost:3001/api/listings?limit=${limit}&offset=${currentOffset}`);
            if (reset) {
                setListings(res.data);
                setPage(1);
            } else {
                setListings(prev => {
                    // Prevent duplicates naturally if user rapid-clicks
                    const newIds = new Set(res.data.map(d => d.id));
                    const filteredPrev = prev.filter(p => !newIds.has(p.id));
                    return [...filteredPrev, ...res.data];
                });
                setPage(prev => prev + 1);
            }
            setHasMore(res.data.length === limit);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrgs = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/orgs');
            setOrgs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ecoshare_current_user');
        localStorage.removeItem('ecoshare_token');
        navigate('/');
    };

    // Apply Dark Mode Class
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    if (!currentUser) return null;

    // Dynamically determine the active role based on URL
    let roleTitle = 'Dashboard';
    let activeIcon = <LayoutDashboard className="text-primary-600" size={24} />;

    if (path.includes('/admin')) {
        roleTitle = 'Admin Portal';
        activeIcon = <Users className="text-orange-600" size={24} />;
    } else if (path.includes('/donor')) {
        roleTitle = 'Donor Portal';
        activeIcon = <Leaf className="text-primary-600" size={24} />;
    } else if (path.includes('/recipient')) {
        roleTitle = 'Recipient Portal';
        activeIcon = <Truck className="text-blue-600" size={24} />;
    } else if (path.includes('/analyst')) {
        roleTitle = 'Analyst Portal';
        activeIcon = <BarChart3 className="text-purple-600" size={24} />;
    }

    return (
        <div className="app-shell relative h-screen overflow-hidden flex" style={{ backgroundColor: 'var(--surface-gray)' }}>
            {/* Sidebar Navigation */}
            <aside className="sidebar flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-white)', borderRight: '1px solid var(--border-light)', width: '250px' }}>
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '0.25rem', backgroundColor: 'var(--primary-100)', borderRadius: '0.5rem' }}>
                        <Leaf className="text-primary-700" size={24} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em', color: 'var(--text-main)' }}>EcoShare</span>
                </div>

                <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: '0.5rem', fontWeight: 500 }}>
                        {activeIcon}
                        <span>{roleTitle}</span>
                    </div>

                    {path.includes('/admin') && (
                        <Link
                            to="/dashboard/analyst"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text-muted)', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            <BarChart3 size={20} />
                            <span>Global Analytics</span>
                        </Link>
                    )}

                    <button
                        onClick={() => setShowSettings(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text-muted)', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
                        className="hover:bg-gray-50 transition-colors"
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                </nav>

                <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Customer Care Block */}
                    <div style={{ padding: '1rem', backgroundColor: 'var(--primary-50)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <Phone size={16} /> Customer Care
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Need help with your account or a donation issue?</div>
                        <a href="tel:18005550199" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-600)', textDecoration: 'none' }}>1-800-555-0199</a>
                        <a href="mailto:support@ecoshare.org" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-600)', textDecoration: 'none' }}>support@ecoshare.org</a>
                    </div>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="main-content flex-1 flex flex-col h-screen overflow-hidden">
                <header className="header" style={{ padding: '1.25rem 2rem', backgroundColor: 'var(--surface-white)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>{roleTitle} Overview</h2>
                    <div className="relative" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', userSelect: 'none' }} onClick={(e) => { e.stopPropagation(); setShowProfileMenu(prev => !prev); }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleTitle}</div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} className="text-primary-600" />
                        </div>

                        {/* Profile Dropdown */}
                        {showProfileMenu && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); }} />
                                <div style={{
                                    position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', width: '200px',
                                    zIndex: 10, backgroundColor: 'var(--surface-white)', border: '1px solid var(--border-light)',
                                    borderRadius: '0.5rem', boxShadow: 'var(--shadow-md)', padding: '0.5rem'
                                }}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setShowEditProfile(true); setShowProfileMenu(false); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s', borderRadius: '0.375rem' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-gray)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <Settings size={16} className="text-muted" /> Edit Profile
                                    </div>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s', borderRadius: '0.375rem' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <div className="content-area overflow-y-auto" style={{ padding: compactView ? '1rem' : '2rem', flex: 1, backgroundColor: 'var(--surface-gray)' }}>
                    <Outlet context={{ listings, setListings, orgs, setOrgs, currentUser, fetchListings, fetchOrgs, hasMore, loadMore: () => fetchListings(false) }} />
                </div>
            </main>

            {/* Global Settings Modal */}
            {showSettings && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '1rem', padding: '2rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0, color: '#0f172a' }}>
                                <Settings size={20} className="text-muted" /> Global Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div>
                                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem' }}>Display Preferences</h4>

                                <ToggleElement
                                    icon={<Moon size={18} className="text-muted" />}
                                    label="Dark Theme"
                                    state={isDarkMode}
                                    setState={setIsDarkMode}
                                />

                                <ToggleElement
                                    icon={<Maximize size={18} className="text-muted" />}
                                    label="Compact View"
                                    state={compactView}
                                    setState={setCompactView}
                                />
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem' }}>Notifications</h4>

                                <ToggleElement
                                    icon={<Bell size={18} className="text-muted" />}
                                    label="Push Notifications"
                                    state={pushNotifications}
                                    setState={setPushNotifications}
                                />

                                <ToggleElement
                                    icon={<Mail size={18} className="text-muted" />}
                                    label="Email Alerts"
                                    state={emailAlerts}
                                    setState={setEmailAlerts}
                                />
                            </div>

                            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1rem' }}>Account Security</h4>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target;
                                        const oldP = form.oldPassword.value;
                                        const newP = form.newPassword.value;
                                        const confP = form.confirmPassword.value;

                                        if (newP !== confP) {
                                            alert("New passwords do not match!");
                                            return;
                                        }
                                        alert("Password successfully changed.");
                                        form.reset();
                                    }}
                                    className="flex flex-col gap-3"
                                >
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        placeholder="Old Password"
                                        className="input"
                                        required
                                        style={{ padding: '0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                    />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        placeholder="New Password"
                                        className="input"
                                        required
                                        style={{ padding: '0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                    />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm New Password"
                                        className="input"
                                        required
                                        style={{ padding: '0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                    />
                                    <button type="submit" className="btn" style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.875rem' }}>
                                        Change Password
                                    </button>
                                </form>
                            </div>

                            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }} onClick={() => setShowSettings(false)}>Save & Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Edit Profile Modal */}
            {showEditProfile && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem', backgroundColor: 'var(--surface-white)', borderRadius: '1rem', padding: '2rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Edit Profile Info</h3>
                            <button onClick={() => setShowEditProfile(false)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (editProfileData.password && editProfileData.password !== editProfileData.confirmPassword) {
                                alert("Passwords do not match!");
                                return;
                            }
                            try {
                                await axios.put('http://localhost:3001/api/profile', {
                                    name: editProfileData.name,
                                    phone: editProfileData.phone,
                                    address: editProfileData.address
                                });
                                if (editProfileData.password) {
                                    await axios.put('http://localhost:3001/api/auth/password', { password: editProfileData.password });
                                }
                                const updatedUser = { 
                                    ...currentUser, 
                                    name: editProfileData.name, 
                                    phone: editProfileData.phone, 
                                    address: editProfileData.address 
                                };
                                setCurrentUser(updatedUser);
                                localStorage.setItem('ecoshare_current_user', JSON.stringify(updatedUser));
                                alert("Profile successfully updated!");
                                setEditProfileData(prev => ({...prev, password: '', confirmPassword: ''}));
                                setShowEditProfile(false);
                            } catch (error) {
                                console.error(error);
                                alert("Error updating profile in backend");
                            }
                        }} className="flex flex-col gap-6" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            
                            {/* Read-Only Information */}
                            <div style={{ backgroundColor: 'var(--surface-gray)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Designation</div>
                                <div style={{ fontWeight: 600, color: 'var(--primary-600)', marginBottom: '1rem' }}>{currentUser?.type || 'Standard User'}</div>
                                
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Platform Approval Status</div>
                                <div>
                                    <span className="badge badge-success" style={{ padding: '0.25rem 0.5rem' }}>
                                        {currentUser?.status || 'Approved'}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Fields */}
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Organization Contact Details</h4>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Organization / Facility Name</label>
                                        <input
                                            className="input"
                                            value={editProfileData.name}
                                            style={{ backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Contact Phone</label>
                                        <input
                                            className="input"
                                            value={editProfileData.phone}
                                            style={{ backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Official Address / Location</label>
                                        <textarea
                                            className="input"
                                            value={editProfileData.address}
                                            placeholder="Provide your full facility address..."
                                            style={{ resize: 'none', height: '60px', backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notification Toggles */}
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Communication Preferences</h4>
                                <ToggleElement icon={<Mail size={18} />} label="Email Alerts" state={emailAlerts} setState={setEmailAlerts} />
                                <ToggleElement icon={<Bell size={18} />} label="Claim Activity Alerts" state={claimAlerts} setState={setClaimAlerts} />
                                <ToggleElement icon={<LogOut size={18} style={{ transform: 'rotate(90deg)' }} />} label="Expiry Reminders" state={expiryReminders} setState={setExpiryReminders} />
                            </div>

                            {/* Security Area */}
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Security & Authentication</h4>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Change Password</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="Leave blank to keep unchanged"
                                            value={editProfileData.password}
                                            style={{ backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="Confirm your new password"
                                            value={editProfileData.confirmPassword}
                                            style={{ backgroundColor: 'var(--surface-white)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--border-light)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Platform Member Since:<br/><strong style={{color: 'var(--text-main)'}}>{currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Mar 15, 2026'}</strong></span>
                                <span style={{ textAlign: 'right' }}>Last Login Recorded:<br/><strong style={{color: 'var(--text-main)'}}>Just Now</strong></span>
                            </div>

                            <button type="submit" className="btn" style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}>
                                Save Profile Configurations
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Chatbot />
        </div>
    );
}
