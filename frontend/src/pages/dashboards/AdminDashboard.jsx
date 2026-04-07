import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, X, Check, Users as UsersIcon, Package as PackageIcon, Trash2, Info, MapPin, Phone, Activity, Server, AlertCircle, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

export default function AdminDashboard() {
    const { orgs, fetchOrgs, listings, fetchListings, hasMore, loadMore } = useOutletContext();
    const [showForm, setShowForm] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [orgPassword, setOrgPassword] = useState('');
    const [orgType, setOrgType] = useState('Recipient');
    const [selectedListing, setSelectedListing] = useState(null);
    const [trackingListing, setTrackingListing] = useState(null);
    const [editingListing, setEditingListing] = useState(null);
    const [editModeData, setEditModeData] = useState({ title: '', quantity: '', time: '' });
    const [showAddFoodForm, setShowAddFoodForm] = useState(false);
    const [addFoodFormData, setAddFoodFormData] = useState({ title: '', days: '', time: '', location: '', donorName: '', contact: '', isUrgent: false });
    const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'moderation' | 'analysis' | 'notifications' | 'reports' | 'audit'
    const [reports, setReports] = useState([]);
    
    // Moderation Filters
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDonor, setFilterDonor] = useState('');

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState([]);

    React.useEffect(() => {
        fetchReports();
        const savedLogs = localStorage.getItem('ecoshare_audit_logs');
        if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    }, []);

    const pushLog = (action, details) => {
        const newLog = { 
            id: Date.now(), 
            action, 
            details, 
            timestamp: new Date().toLocaleString() 
        };
        setAuditLogs(prev => {
            const updated = [newLog, ...prev];
            localStorage.setItem('ecoshare_audit_logs', JSON.stringify(updated));
            return updated;
        });
    };

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('ecoshare_token');
            const res = await axios.get('http://localhost:3001/api/reports', { headers: { Authorization: `Bearer ${token}` } });
            setReports(res.data);
        } catch (e) { console.error('Failed to fetch reports'); }
    };

    const handleResolveReport = async (id) => {
        try {
            const token = localStorage.getItem('ecoshare_token');
            await axios.put(`http://localhost:3001/api/reports/${id}/resolve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            pushLog('RESOLVE_REPORT', `Resolved report ID: ${id}`);
            fetchReports();
        } catch (e) { alert(e.message); }
    };

    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:3001/api/orgs/${id}/status`, { status: 'Approved' });
            pushLog('APPROVE_USER', `Approved organization ID: ${id}`);
            fetchOrgs();
        } catch (e) { alert(e.message); }
    };

    const handleReject = async (id) => {
        try {
            await axios.put(`http://localhost:3001/api/orgs/${id}/status`, { status: 'Rejected' });
            pushLog('BAN_USER', `Rejected/Banned organization ID: ${id}`);
            fetchOrgs();
        } catch (e) { alert(e.message); }
    };

    const handleDeleteOrg = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this organization?")) {
            try {
                await axios.delete(`http://localhost:3001/api/orgs/${id}`);
                pushLog('DELETE_ORG', `Permanently deleted organization ID: ${id}`);
                fetchOrgs();
            } catch (e) { alert(e.response?.data?.error || e.message); }
        }
    };

    const handleAddOrg = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/auth/register', {
                name: orgName,
                email: `${orgName.replace(/\s+/g, '').toLowerCase()}@test.com`,
                password: orgPassword,
                type: orgType,
                status: 'Approved'
            });
            fetchOrgs();
            setOrgName('');
            setOrgPassword('');
            setShowForm(false);
        } catch (e) { alert(e.response?.data?.error || e.message); }
    };

    const handleRemoveListing = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/api/listings/${id}`);
            pushLog('DELETE_LISTING', `Deleted listing ID: ${id}`);
            fetchListings();
        } catch (e) { alert(e.message); }
    };

    const handleToggleUrgent = async (listing) => {
        try {
            await axios.put(`http://localhost:3001/api/listings/${listing.id}`, { isUrgent: !listing.isUrgent });
            pushLog('UPDATE_URGENT', `Toggled urgency for listing ID: ${listing.id}`);
            fetchListings();
        } catch (e) { alert(e.message); }
    };

    const handleUpdateListingStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:3001/api/listings/${id}`, { status });
            pushLog('UPDATE_STATUS', `Marked listing ID: ${id} as ${status}`);
            fetchListings();
        } catch (e) { alert(e.message); }
    };

    const handleFailListing = async (id) => {
        if (window.confirm("Mark as Failed? This will remove it from the active marketplace and mark it as failed/spoiled.")) {
            handleUpdateListingStatus(id, 'Failed');
        }
    };

    const handleOpenEdit = (listing) => {
        setEditingListing(listing);
        setEditModeData({
            title: listing.title,
            quantity: listing.quantity || '',
            time: listing.time || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:3001/api/listings/${editingListing.id}`, {
                title: editModeData.title,
                quantity: editModeData.quantity,
                time: editModeData.time
            });
            fetchListings();
            setEditingListing(null);
        } catch (e) { alert(e.message); }
    };

    const handleAddFoodSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: addFoodFormData.title,
            expiry: `Expires in ${addFoodFormData.days} days`,
            status: 'Available',
            distance: (Math.random() * 5 + 0.5).toFixed(1) + ' mi',
            quantity: addFoodFormData.quantity || Math.floor(Math.random() * 100 + 20) + ' items',
            time: addFoodFormData.time,
            location: addFoodFormData.location,
            donorName: addFoodFormData.donorName || 'Admin (System)',
            contact: addFoodFormData.contact,
            isUrgent: addFoodFormData.isUrgent,
            claimed: false
        };
        try {
            await axios.post('http://localhost:3001/api/listings', payload);
            fetchListings();
            setAddFoodFormData({ title: '', days: '', time: '', location: '', donorName: '', contact: '', isUrgent: false });
            setShowAddFoodForm(false);
        } catch (e) { alert(e.message); }
    };

    const stats = [
        { label: 'Total Users', val: orgs.length },
        { label: 'Active Listings', val: listings.filter(l => l.status === 'Available').length },
        { label: 'Success Rate', val: listings.length > 0 ? ((listings.filter(l => l.status === 'Claimed' || l.status === 'PickedUp').length / listings.length) * 100).toFixed(1) + '%' : '0%' },
        { label: 'Waste Rate', val: listings.length > 0 ? ((listings.filter(l => l.status === 'Failed' || l.status === 'Spoiled' || l.status === 'Redirected').length / listings.length) * 100).toFixed(1) + '%' : '0%' }
    ];

    const displayListings = listings.filter(l => {
        if (filterStatus !== 'All' && l.status !== filterStatus) return false;
        if (filterDonor && !l.donorName?.toLowerCase().includes(filterDonor.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h3>Platform Overview</h3>
                    <p>Monitor system health, manage active organizations, and moderate content.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ backgroundColor: 'white' }} onClick={() => setShowAddFoodForm(true)}>Add Food Listing</button>
                    <button className="btn" onClick={() => setShowForm(true)}>Add New Organization</button>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card">
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {stat.val}
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex justify-center flex-wrap gap-4" style={{ marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'verifications' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px' }}
                    onClick={() => setActiveTab('verifications')}
                >
                    <ShieldCheck size={18} style={{ marginRight: '0.5rem' }} /> Verifications
                </button>
                <button
                    className={`btn ${activeTab === 'moderation' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px' }}
                    onClick={() => setActiveTab('moderation')}
                >
                    <Check size={18} style={{ marginRight: '0.5rem' }} /> Moderation
                </button>
                <button
                    className={`btn ${activeTab === 'analysis' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px' }}
                    onClick={() => setActiveTab('analysis')}
                >
                    <Activity size={18} style={{ marginRight: '0.5rem' }} /> Analysis
                </button>

                <button
                    className={`btn ${activeTab === 'notifications' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px' }}
                    onClick={() => setActiveTab('notifications')}
                >
                    <Bell size={18} style={{ marginRight: '0.5rem' }} /> Notifications
                </button>
                <button
                    className={`btn ${activeTab === 'reports' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px', backgroundColor: activeTab === 'reports' ? '#ef4444' : 'transparent', color: activeTab === 'reports' ? 'white' : '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => setActiveTab('reports')}
                >
                    <AlertCircle size={18} style={{ marginRight: '0.5rem' }} /> Reports
                    {reports.filter(r => r.status === 'Pending').length > 0 && <span style={{ marginLeft: '0.5rem', backgroundColor: activeTab === 'reports' ? 'white' : '#ef4444', color: activeTab === 'reports' ? '#ef4444' : 'white', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>{reports.filter(r => r.status === 'Pending').length}</span>}
                </button>
                <button
                    className={`btn ${activeTab === 'audit' ? '' : 'btn-outline'}`}
                    style={{ borderRadius: '2rem', minWidth: '150px' }}
                    onClick={() => setActiveTab('audit')}
                >
                    <Server size={18} style={{ marginRight: '0.5rem' }} /> Audit Logs
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Organization Verifications Tab */}
                {activeTab === 'verifications' && (
                    <div className="card animate-fade-in">
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Organization Verifications</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Organization Name</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, minWidth: '160px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orgs.filter(o => o.type !== 'Admin').map(org => (
                                        <tr key={org.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <UsersIcon size={16} className="text-muted" /> {org.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{org.type}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge ${org.status === 'Approved' ? 'badge-success' : org.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {org.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {org.status === 'Pending' ? (
                                                        <>
                                                            <button
                                                                className="btn"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', flex: 1, justifyContent: 'center', gap: '0.25rem', backgroundColor: 'var(--success)' }}
                                                                onClick={() => handleApprove(org.id)}
                                                                title="Accept"
                                                            >
                                                                <Check size={14} /> Accept
                                                            </button>
                                                            <button
                                                                className="btn"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', flex: 1, justifyContent: 'center', gap: '0.25rem', backgroundColor: 'var(--warning)' }}
                                                                onClick={() => handleReject(org.id)}
                                                                title="Reject"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </>
                                                    ) : org.status === 'Approved' ? (
                                                        <>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                                                                <ShieldCheck size={16} className="text-success" /> Verified
                                                            </span>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', flex: 1, justifyContent: 'center', gap: '0.25rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                                                                onClick={() => handleReject(org.id)}
                                                                title="Reject"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span style={{ color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                                                                <X size={16} /> Rejected
                                                            </span>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', flex: 1, justifyContent: 'center', gap: '0.25rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                                                                onClick={() => handleApprove(org.id)}
                                                                title="Accept"
                                                            >
                                                                <Check size={14} /> Accept
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Always show delete button */}
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.25rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                                        onClick={() => handleDeleteOrg(org.id)}
                                                        title="Delete Organization"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Moderation Tab */}
                {activeTab === 'moderation' && (
                    <div className="card animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.125rem' }}>Food Listings Moderation</h3>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select 
                                    className="input-field" 
                                    style={{ padding: '0.5rem', minWidth: '150px' }}
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Available">Available</option>
                                    <option value="Claimed">Claimed</option>
                                    <option value="PickedUp">PickedUp</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Spoiled">Spoiled</option>
                                    <option value="Redirected">Redirected</option>
                                </select>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Filter by donor name..." 
                                    style={{ padding: '0.5rem' }}
                                    value={filterDonor}
                                    onChange={(e) => setFilterDonor(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Donation Title</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quantity / Dist</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Claimed By</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayListings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No listings match the current filters.
                                            </td>
                                        </tr>
                                    ) : displayListings.map(listing => (
                                        <tr key={listing.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: listing.status === 'Claimed' ? 0.6 : 1 }}>
                                                    <PackageIcon size={16} className="text-muted" /> {listing.title}
                                                    {listing.isUrgent && <span className="badge badge-danger text-xs">Urgent Pickup</span>}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: '1.5rem' }}>{listing.expiry}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{listing.quantity || 'N/A'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{listing.distance}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge ${listing.status === 'Available' ? 'badge-success' : listing.status === 'Failed' || listing.status === 'Spoiled' ? 'badge-danger' : 'badge-neutral'}`}>
                                                    {listing.status === 'Failed' ? 'Failed' : listing.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {listing.claimedBy ? (
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-600)' }}>{listing.claimedBy}</div>
                                                ) : (
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {listing.status === 'Available' && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderColor: '#d97706', color: '#d97706', borderRadius: '2rem' }}
                                                            onClick={() => handleToggleUrgent(listing)}
                                                            title={listing.isUrgent ? "Remove Urgent Status" : "Mark as Urgent Retrieval"}
                                                        >
                                                            <AlertCircle size={16} /> {listing.isUrgent ? 'Unmark Urgent' : 'Mark Urgent'}
                                                        </button>
                                                    )}
                                                    {listing.status === 'Claimed' && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderColor: '#b91c1c', color: '#b91c1c', borderRadius: '2rem' }}
                                                            onClick={() => handleFailListing(listing.id)}
                                                            title="Mark as Failed"
                                                        >
                                                            <AlertCircle size={16} /> Mark Failed
                                                        </button>
                                                    )}
                                                    {(listing.status === 'Failed' || listing.status === 'Available') && (
                                                        <>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderColor: '#b91c1c', color: '#b91c1c', borderRadius: '2rem' }}
                                                                onClick={() => {
                                                                    if (window.confirm("Mark as permanently Spoiled?")) {
                                                                        handleUpdateListingStatus(listing.id, 'Spoiled');
                                                                    }
                                                                }}
                                                                title="Mark as Spoiled"
                                                            >
                                                                <Trash2 size={16} /> Spoiled
                                                            </button>
                                                            <button
                                                                className="btn btn-outline"
                                                                style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderColor: '#0ea5e9', color: '#0ea5e9', borderRadius: '2rem' }}
                                                                onClick={() => {
                                                                    if (window.confirm("Redirect this listing to an Orphanage/Needy organization?")) {
                                                                        handleUpdateListingStatus(listing.id, 'Redirected');
                                                                    }
                                                                }}
                                                                title="Send to Orphanage/Needy"
                                                            >
                                                                <PackageIcon size={16} /> Redirect
                                                            </button>
                                                        </>
                                                    )}
                                                    {(listing.status === 'Available' || listing.status === 'Failed' || listing.status === 'Spoiled') && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary-600)', borderColor: 'var(--primary-600)', borderRadius: '2rem' }}
                                                            onClick={() => handleOpenEdit(listing)}
                                                            title="God-Mode Edit"
                                                        >
                                                            God Edit
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', borderColor: 'var(--border-light)', borderRadius: '2rem' }}
                                                        onClick={() => setSelectedListing(listing)}
                                                        title="View Details"
                                                    >
                                                        <Info size={16} /> Info
                                                    </button>
                                                    {(listing.status === 'Claimed' || listing.status === 'PickedUp') && (
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#3b82f6', borderColor: '#3b82f6', borderRadius: '2rem' }}
                                                            onClick={() => setTrackingListing({ ...listing, pickedUp: listing.status === 'PickedUp' })}
                                                            title="Track Status"
                                                        >
                                                            <MapPin size={16} /> Track
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderColor: 'var(--danger)', color: 'var(--danger)', borderRadius: '2rem' }}
                                                        onClick={() => handleRemoveListing(listing.id)}
                                                        title="Delete Listing"
                                                    >
                                                        <Trash2 size={16} /> Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {hasMore && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
                                <button 
                                    className="btn btn-outline" 
                                    onClick={loadMore}
                                    style={{ padding: '0.75rem 2rem', fontWeight: 600, color: '#10b981', borderColor: '#10b981', borderRadius: '9999px' }}
                                >
                                    Load More Core Listings
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Total System Analysis Tab */}
                {activeTab === 'analysis' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {/* Listings Status Area Chart */}
                            <div className="card">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 style={{ margin: 0 }}>Listings Activity Overview</h4>
                                    <Activity size={18} className="text-muted" />
                                </div>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { status: 'Available', Count: listings.filter(l => l.status === 'Available').length },
                                            { status: 'Claimed', Count: listings.filter(l => l.status === 'Claimed').length },
                                            { status: 'Failed', Count: listings.filter(l => l.status === 'Failed' || l.status === 'Spoiled' || l.status === 'Redirected').length }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                                            <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} />
                                            <Tooltip cursor={{ fill: 'var(--surface-gray)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="Count" fill="var(--primary-600)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Org Distribution Bar Chart */}
                            <div className="card">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 style={{ margin: 0 }}>Platform Registrations by Role</h4>
                                    <UsersIcon size={18} className="text-muted" />
                                </div>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            {
                                                category: 'Organizations',
                                                Donors: orgs.filter(o => o.type === 'Donor').length,
                                                Recipients: orgs.filter(o => o.type === 'Recipient').length,
                                                Analysts: orgs.filter(o => o.type === 'Analyst').length
                                            }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                                            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} />
                                            <Tooltip cursor={{ fill: 'var(--surface-gray)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="Donors" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Recipients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Analysts" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Placeholder */}
                {activeTab === 'notifications' && (
                    <div className="card animate-fade-in text-center" style={{ padding: '4rem 2rem' }}>
                        <Bell size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>System Notifications</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Important system alerts, platform updates, and flagged accounts will appear here. No new notifications.
                        </p>
                    </div>
                )}

                {/* Reports Administration Tab */}
                {activeTab === 'reports' && (
                    <div className="card animate-fade-in">
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem' }}>User Misconduct & Reports</h3>
                            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={fetchReports}>
                                Refresh
                            </button>
                        </div>
                        {reports.length === 0 ? (
                            <div className="text-center" style={{ padding: '3rem 2rem' }}>
                                <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Active Reports</h3>
                                <p style={{ color: 'var(--text-muted)' }}>The community is actively self-moderating. There are no pending reports.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Target Listing</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Reported By</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Date</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, width: '30%' }}>Violation Category / Reason</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500, minWidth: '120px' }}>Resolution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(report => (
                                            <tr key={report.id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: report.status === 'Resolved' ? 'var(--surface-gray)' : 'transparent', opacity: report.status === 'Resolved' ? 0.6 : 1 }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                                                        <PackageIcon size={16} className="text-muted" /> {report.listing_title}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--text-main)', fontSize: '0.875rem' }}>{report.reporter_name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', color: report.status === 'Pending' ? '#ef4444' : 'var(--text-muted)', fontSize: '0.875rem', fontWeight: report.status === 'Pending' ? 500 : 400 }}>
                                                    {report.reason}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {report.status === 'Pending' ? (
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '2rem', border: 'none' }}
                                                            onClick={() => handleResolveReport(report.id)}
                                                        >
                                                            <Check size={14} style={{ marginRight: '0.25rem', display: 'inline' }} /> Mark Resolved
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.875rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                                            <Check size={16} /> Resolved
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {/* Audit Tab */}
                {activeTab === 'audit' && (
                    <div className="card animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem' }}>System Audit Logs</h3>
                            <button className="btn btn-outline" onClick={() => { setAuditLogs([]); localStorage.removeItem('ecoshare_audit_logs'); }}>
                                Clear Logs
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Timestamp</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Action</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No administrative actions recorded in this session.
                                            </td>
                                        </tr>
                                    ) : auditLogs.map((log) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.id}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{log.timestamp}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className={`badge ${log.action.includes('DELETE') || log.action.includes('BAN') ? 'badge-danger' : 
                                                    log.action.includes('APPROVE') ? 'badge-success' : 
                                                    log.action.includes('RESOLVE') ? 'badge-primary' : 'badge-neutral'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Listing Info Modal Overlay */}
            {
                selectedListing && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>Full Listing Details</h3>
                                <button onClick={() => setSelectedListing(null)} style={{ color: 'var(--text-muted)' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Food Item Title</div>
                                    <div style={{ fontWeight: 600 }}>{selectedListing.title}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Donor Organization</div>
                                    <div style={{ fontWeight: 500 }}>{selectedListing.donorName || 'External Donor (Not specified)'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Reference</div>
                                    <div>{selectedListing.contact || 'No contact provided'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Pickup Location</div>
                                    <div>{selectedListing.location || selectedListing.distance}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status & Timing</div>
                                    <div><span className={`badge ${selectedListing.status === 'Available' ? 'badge-success' : 'badge-neutral'}`} style={{ marginRight: '0.5rem' }}>{selectedListing.status}</span></div>
                                    <div style={{ marginTop: '0.25rem' }}>{selectedListing.time}</div>
                                    <div>{selectedListing.expiry}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>System ID</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedListing.id}</div>
                                </div>
                                <button className="btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setSelectedListing(null)}>Dismiss</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal */}
            {
                showForm && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>Add Organization</h3>
                                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddOrg} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Name</label>
                                    <input
                                        className="input"
                                        required
                                        value={orgName}
                                        onChange={e => setOrgName(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        required
                                        value={orgPassword}
                                        onChange={e => setOrgPassword(e.target.value)}
                                        placeholder="Secure password"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role Type</label>
                                    <select
                                        className="input"
                                        value={orgType}
                                        onChange={e => setOrgType(e.target.value)}
                                        style={{ backgroundColor: 'white' }}
                                    >
                                        <option value="Recipient">Recipient</option>
                                        <option value="Donor">Donor</option>
                                        <option value="Analyst">Analyst</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>Create Account</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Tracking Modal Overlay */}
            {
                trackingListing && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>Donation Tracking Reference</h3>
                                <button onClick={() => setTrackingListing(null)} style={{ color: 'var(--text-muted)' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div style={{ padding: '1rem', backgroundColor: 'var(--surface-gray)', borderRadius: '0.5rem' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{trackingListing.title}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tracking Code: #{trackingListing.id.toString().slice(-6)}</div>
                                </div>

                                <div style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <UsersIcon size={16} className="text-muted" /> Claimed By: <span style={{ color: 'var(--primary-600)' }}>{trackingListing.claimedBy || 'Unknown Recipient'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <Phone size={16} className="text-muted" /> Donor Contact: {trackingListing.contact || 'N/A'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        <MapPin size={16} className="text-muted" /> Live Location: {trackingListing.location || trackingListing.distance}
                                    </div>

                                    {/* Live Tracking Map View */}
                                    <div style={{ marginTop: '0.25rem', width: '100%', height: '160px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
                                        <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(trackingListing.location || "San Francisco")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}></iframe>
                                        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', backgroundColor: 'var(--surface-white)', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary-600)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span> LIVE GPs
                                        </div>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--primary-200)', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)' }}></div>
                                        <div style={{ fontWeight: 600, color: 'var(--success)' }}>Donation Claimed</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Successfully claimed by a recipient organization.</div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'white', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)', border: '3px solid var(--primary-600)', boxShadow: '0 0 0 2px white' }}></div>
                                        <div style={{ fontWeight: 600 }}>Awaiting Pickup</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recipient must proceed to {trackingListing.location || trackingListing.distance} before {trackingListing.time}.</div>
                                    </div>
                                    <div style={{ position: 'relative', opacity: 0.5 }}>
                                        <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-light)', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)' }}></div>
                                        <div style={{ fontWeight: 600 }}>Completed</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Food securely rescued!</div>
                                    </div>
                                </div>

                                <button className="btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setTrackingListing(null)}>Close Tracking</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Editing (God-Mode) Modal */}
            {
                editingListing && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem', border: '2px solid var(--primary-500)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }}>God-Mode: Edit Active Listing</h3>
                                <button onClick={() => setEditingListing(null)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Donation Title</label>
                                    <input
                                        className="input"
                                        required
                                        value={editModeData.title}
                                        onChange={e => setEditModeData({ ...editModeData, title: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Modify Quantity</label>
                                    <input
                                        className="input"
                                        required
                                        value={editModeData.quantity}
                                        onChange={e => setEditModeData({ ...editModeData, quantity: e.target.value })}
                                        placeholder="e.g., 50 Items"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Update Pickup Time</label>
                                    <input
                                        className="input"
                                        required
                                        value={editModeData.time}
                                        onChange={e => setEditModeData({ ...editModeData, time: e.target.value })}
                                    />
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '0.25rem' }}>
                                    Warning: Editing an active listing bypasses normal donor workflows. Use with caution.
                                </div>

                                <button type="submit" className="btn" style={{ marginTop: '0.5rem' }}>Force Save Changes</button>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Admin Add Food Listing Modal */}
            {showAddFoodForm && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Admin: Create Food Listing</h3>
                            <button onClick={() => setShowAddFoodForm(false)} style={{ color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFoodSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Food Name / Title</label>
                                <input
                                    className="input"
                                    placeholder="e.g., 50 items Fresh Assorted Produce"
                                    required
                                    value={addFoodFormData.title}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, title: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>How many days before expiry?</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input"
                                    placeholder="e.g., 2"
                                    required
                                    value={addFoodFormData.days}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, days: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pickup Time</label>
                                <input
                                    className="input"
                                    placeholder="e.g., Today before 5 PM"
                                    required
                                    value={addFoodFormData.time}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, time: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pickup Place (Location)</label>
                                <input
                                    className="input"
                                    placeholder="e.g., 123 Main St, Back Alley Door"
                                    required
                                    value={addFoodFormData.location}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, location: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Donated By (Organization Name)</label>
                                <input
                                    className="input"
                                    placeholder="e.g., City Star Supermarket"
                                    required
                                    value={addFoodFormData.donorName}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, donorName: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contact Number</label>
                                <input
                                    className="input"
                                    placeholder="e.g., (555) 123-4567"
                                    required
                                    value={addFoodFormData.contact}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, contact: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="urgentCheckAdmin"
                                    checked={addFoodFormData.isUrgent}
                                    onChange={e => setAddFoodFormData({ ...addFoodFormData, isUrgent: e.target.checked })}
                                    style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                                />
                                <label htmlFor="urgentCheckAdmin" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--danger)', cursor: 'pointer' }}>Mark for Urgent Pickup</label>
                            </div>
                            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddFoodForm(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ flex: 1 }}>Post Donation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
