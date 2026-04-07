import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Package, Plus, X, AlertCircle, MapPin, Users, Phone } from 'lucide-react';
import axios from 'axios';

export default function DonorDashboard() {
    const { listings, fetchListings, currentUser, hasMore, loadMore } = useOutletContext();
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('present');
    const [formData, setFormData] = useState({ title: '', days: '', quantity: '', timeStart: '', timeEnd: '', location: '', donorName: '', contact: '', isUrgent: false });
    const [editingListing, setEditingListing] = useState(null);
    const [editModeData, setEditModeData] = useState({ title: '', quantity: '', timeStart: '', timeEnd: '', location: '' });

    useEffect(() => {
        // Redundant double fetch from Prototype removed. Parent global router natively handles pulling listings.
    }, []);

    // Filter only current user's donations
    const myListings = listings.filter(l => l.donor_id == currentUser?.id || l.donorName === currentUser?.name);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: formData.title,
            expiry: `Expires in ${formData.days} days`,
            status: 'Available',
            distance: (Math.random() * 5 + 0.5).toFixed(1) + ' mi',
            quantity: formData.quantity,
            time: formData.timeEnd ? `${formData.timeStart} to ${formData.timeEnd}` : formData.timeStart,
            location: formData.location,
            donorName: formData.donorName || currentUser?.name,
            contact: formData.contact,
            isUrgent: formData.isUrgent,
            claimed: false,
            donor_id: currentUser?.id
        };
        try {
            await axios.post('http://localhost:3001/api/listings', payload);
            fetchListings();
            setFormData({ title: '', days: '', quantity: '', timeStart: '', timeEnd: '', location: '', donorName: '', contact: '', isUrgent: false });
            setShowForm(false);
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleFail = async (id) => {
        if (window.confirm("Mark as Failed? This removes the listing from the platform and notifies the Admin that the food is spoiled or cannot be donated.")) {
            try {
                await axios.put(`http://localhost:3001/api/listings/${id}`, { status: 'Failed' });
                fetchListings();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const handleOpenEdit = (listing) => {
        setEditingListing(listing.id);
        const qVal = listing.quantity ? listing.quantity.replace(' items', '') : '';
        let tStart = '';
        let tEnd = '';
        if (listing.time && listing.time.includes(' to ')) {
            const parts = listing.time.split(' to ');
            tStart = parts[0];
            tEnd = parts[1];
        } else {
            tStart = listing.time || '';
        }
        setEditModeData({
            title: listing.title,
            quantity: qVal,
            timeStart: tStart,
            timeEnd: tEnd,
            location: listing.location || ''
        });
    };

    const handleReport = async (item) => {
        const reason = window.prompt(`Please briefly describe the issue with the Recipient for "${item.title}":`);
        if (!reason || !reason.trim()) return;

        try {
            await axios.post('http://localhost:3001/api/reports', { listing_id: item.id, reason });
            alert(`Thank you. Your report has been securely logged and sent to Administrators for review.`);

            fetchListings(); // To instantly fetch updated reports_count
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:3001/api/listings/${editingListing}`, {
                title: editModeData.title,
                quantity: editModeData.quantity,
                time: editModeData.timeEnd ? `${editModeData.timeStart} to ${editModeData.timeEnd}` : editModeData.timeStart,
                location: editModeData.location
            });
            fetchListings();
            setEditingListing(null);
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Donations</h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Create new listings and track your impact.</p>
                </div>
                <button
                    className="btn"
                    style={{ backgroundColor: '#10b981', borderRadius: '9999px', color: 'white', fontWeight: 600, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                    onClick={() => setShowForm(true)}
                >
                    <Plus size={16} /> New Donation
                </button>
            </div>

            {/* Impact Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>TOTAL DONATIONS</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{myListings.length}</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>SUCCESSFUL DONATIONS</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{myListings.filter(l => l.status === 'PickedUp').length}</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>TOTAL FAILED</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{myListings.filter(l => l.status === 'Failed' || l.status === 'Spoiled' || l.status === 'Redirected').length}</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>TOTAL ACTIVE</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{myListings.filter(l => l.status === 'Available').length}</div>
                </div>
            </div>

            {/* Listings Header & Tabs */}
            <div className="card animate-fade-in" style={{ padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>My Donations List</h3>
                    <div className="flex gap-2 bg-white" style={{ border: '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '9999px', flexWrap: 'wrap' }}>
                        {['present', 'completed', 'failed', 'all'].map(tab => (
                            <button
                                key={tab}
                                className="btn"
                                style={{
                                    borderRadius: '9999px',
                                    backgroundColor: activeTab === tab ? '#10b981' : 'transparent',
                                    color: activeTab === tab ? 'white' : '#64748b',
                                    border: 'none',
                                    padding: '0.4rem 1rem',
                                    fontSize: '0.75rem',
                                    textTransform: 'capitalize',
                                    fontWeight: activeTab === tab ? 600 : 500,
                                    boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'all' ? 'All History' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ width: '100%' }}>
                    {myListings.filter(item => {
                        if (activeTab === 'all') return true;
                        if (activeTab === 'present') return item.status === 'Available';
                        if (activeTab === 'completed') return item.status === 'Claimed' || item.status === 'PickedUp';
                        if (activeTab === 'failed') return item.status === 'Failed' || item.status === 'Spoiled' || item.status === 'Redirected';
                        return false;
                    }).length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            <Package size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.875rem' }}>No {activeTab} donations found.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {myListings.filter(item => {
                                if (activeTab === 'present') return item.status === 'Available';
                                if (activeTab === 'completed') return item.status === 'Claimed' || item.status === 'PickedUp';
                                if (activeTab === 'failed') return item.status === 'Failed' || item.status === 'Spoiled' || item.status === 'Redirected';
                                return false;
                            }).map(item => (
                                <div key={item.id} style={{ padding: '1rem', border: item.reports_count > 0 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: item.reports_count > 0 ? '#fef2f2' : '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={16} color={item.reports_count > 0 ? '#ef4444' : '#64748b'} />
                                            {item.title}
                                            {item.isUrgent && <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#ef4444', textTransform: 'uppercase' }}>Urgent Pickup</span>}
                                            {item.reports_count > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: '#ef4444', color: '#ffffff', textTransform: 'uppercase' }}><AlertCircle size={10} /> Recipient Flagged Issue </span>}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                                            {item.expiry} • {item.time} • {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase',
                                            backgroundColor: item.status === 'Available' ? '#dcfce7' : (item.status === 'Failed' || item.status === 'Spoiled') ? '#fee2e2' : (item.status === 'Claimed') ? '#e0f2fe' : (item.status === 'PickedUp') ? '#dbeafe' : '#f1f5f9',
                                            color: item.status === 'Available' ? '#10b981' : (item.status === 'Failed' || item.status === 'Spoiled') ? '#ef4444' : (item.status === 'Claimed') ? '#0284c7' : (item.status === 'PickedUp') ? '#1d4ed8' : '#64748b'
                                        }}>
                                            {item.status === 'Available' ? 'Waiting for Claim' : item.status === 'Claimed' ? 'Claimed by Recipient' : item.status === 'PickedUp' ? 'Successfully Picked Up' : item.status}
                                        </span>
                                        {item.status === 'Available' && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '9999px', backgroundColor: 'transparent' }}
                                                    onClick={() => handleOpenEdit(item)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '9999px', backgroundColor: 'transparent' }}
                                                    onClick={() => handleFail(item.id)}
                                                >
                                                    <AlertCircle size={14} /> Failed
                                                </button>
                                            </div>
                                        )}
                                        {(item.status === 'Claimed' || item.status === 'PickedUp') && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '9999px', backgroundColor: 'transparent' }}
                                                    onClick={() => handleReport(item)}
                                                >
                                                    <AlertCircle size={14} /> Report Issue
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                            <button 
                                className="btn btn-outline" 
                                onClick={loadMore}
                                style={{ padding: '0.75rem 2rem', fontWeight: 600, color: '#10b981', borderColor: '#10b981', borderRadius: '9999px' }}
                            >
                                Load More History
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Listing Modal Overlay */}
            {showForm && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '650px', margin: '2rem', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Create Donation</h3>
                            <button onClick={() => setShowForm(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Food Name / Title</label>
                                <input
                                    className="input"
                                    placeholder="e.g., 50 items Fresh Assorted Produce"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Quantity (Items/Servings)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input"
                                    placeholder="e.g., 50"
                                    required
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
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
                                    value={formData.days}
                                    onChange={e => setFormData({ ...formData, days: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pickup Time Window</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        className="input"
                                        required
                                        value={formData.timeStart || ''}
                                        onChange={e => setFormData({ ...formData, timeStart: e.target.value })}
                                        style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white' }}
                                    />
                                    <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>to</span>
                                    <input
                                        type="time"
                                        className="input"
                                        value={formData.timeEnd || ''}
                                        onChange={e => setFormData({ ...formData, timeEnd: e.target.value })}
                                        style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white' }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pickup Place (Location)</label>
                                <input
                                    className="input"
                                    placeholder="e.g., 123 Main St, Back Alley Door"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Donated By (Organization Name)</label>
                                <input
                                    className="input"
                                    placeholder="e.g., City Star Supermarket"
                                    defaultValue={currentUser?.name}
                                    required
                                    onChange={e => setFormData({ ...formData, donorName: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Contact Number</label>
                                <input
                                    className="input"
                                    placeholder="e.g., (555) 123-4567"
                                    required
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="urgentCheck"
                                    checked={formData.isUrgent}
                                    onChange={e => setFormData({ ...formData, isUrgent: e.target.checked })}
                                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                />
                                <label htmlFor="urgentCheck" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}>Mark for Urgent Pickup (Highly perishable or closing soon)</label>
                            </div>
                            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }}>Post Donation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Listing Modal */}
            {editingListing && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '550px', margin: '2rem', padding: '2rem', borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Edit Listing</h3>
                            <button onClick={() => setEditingListing(null)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Update Title</label>
                                <input
                                    className="input"
                                    required
                                    value={editModeData.title}
                                    onChange={e => setEditModeData({ ...editModeData, title: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Update Location</label>
                                <input
                                    className="input"
                                    required
                                    value={editModeData.location || ''}
                                    onChange={e => setEditModeData({ ...editModeData, location: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Update Quantity (Items)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input"
                                    required
                                    value={editModeData.quantity}
                                    onChange={e => setEditModeData({ ...editModeData, quantity: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Update Pickup Time</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        className="input"
                                        required
                                        value={editModeData.timeStart || ''}
                                        onChange={e => setEditModeData({ ...editModeData, timeStart: e.target.value })}
                                        style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white' }}
                                    />
                                    <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>to</span>
                                    <input
                                        type="time"
                                        className="input"
                                        value={editModeData.timeEnd || ''}
                                        onChange={e => setEditModeData({ ...editModeData, timeEnd: e.target.value })}
                                        style={{ flex: 1, minWidth: 0, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: 'white' }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }} onClick={() => setEditingListing(null)}>Cancel</button>
                                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
