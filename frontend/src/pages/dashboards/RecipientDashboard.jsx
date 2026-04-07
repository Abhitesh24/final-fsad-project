import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, MapPin, Package, Clock, CheckCircle, Info, X, Phone, Users } from 'lucide-react';
import axios from 'axios';

export default function RecipientDashboard() {
    const { listings: items, fetchListings, currentUser } = useOutletContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [trackingItem, setTrackingItem] = useState(null);

    const handleClaim = async (id) => {
        try {
            await axios.patch(`http://localhost:3001/api/listings/${id}/claim`);
            fetchListings();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleUnclaim = async (id) => {
        if (!confirm('Are you sure you want to cancel your claim on this donation? It will become available to other organizations.')) return;
        try {
            await axios.patch(`http://localhost:3001/api/listings/${id}/unclaim`);
            setSelectedItem(prev => prev && prev.id === id ? null : prev);
            fetchListings();
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleCompleteRescue = async (id) => {
        try {
            await axios.patch(`http://localhost:3001/api/listings/${id}/pickup`);
            fetchListings();
            setTrackingItem(prev => prev && prev.id === id ? { ...prev, pickedUp: true } : prev);
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const handleReport = async (item) => {
        const reason = window.prompt(`Please briefly describe the issue with "${item.title}":`);
        if (!reason || !reason.trim()) return;

        try {
            await axios.post('http://localhost:3001/api/reports', { listing_id: item.id, reason });
            alert(`Thank you. Your report has been securely logged and sent to Administrators for review.`);
            setSelectedItem(null);
            fetchListings(); // Refreshes and updates reports_count natively
        } catch (error) {
            alert(error.response?.data?.error || error.message);
        }
    };

    const displayItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Available Food Near You</h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Browse and claim surplus food donations.</p>
                </div>
                <div className="flex gap-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={18} style={{ color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by type..."
                        style={{ width: '250px', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {displayItems.map((item) => {
                    const isClaimedByMe = item.status === 'Claimed' && item.claimed_by_id == currentUser?.id;
                    const isPickedUp = item.status === 'PickedUp' || item.status === 'Rescued';
                    const isClaimedByOther = (item.status === 'Claimed' || item.status === 'PickedUp') && !isClaimedByMe;

                    // Slightly grey out if claimed
                    const opacity = (item.status !== 'Available') ? 0.6 : 1;
                    const bg = (item.status !== 'Available') ? 'var(--surface-gray)' : 'white';

                    // Track if the current user owns this claim
                    const canTrack = isClaimedByMe || isPickedUp && item.claimedBy === currentUser?.name;

                    return (
                        <div key={item.id} className="card flex flex-col gap-4 relative" style={{
                            opacity,
                            backgroundColor: bg,
                            transition: 'all 0.3s ease',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}>
                            <button
                                onClick={() => setSelectedItem(item)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                title="View Details"
                            >
                                <Info size={20} />
                            </button>

                            <div style={{ paddingRight: '2rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem', color: '#0f172a' }}>
                                    {item.title}
                                </div>
                                {item.donorName && (
                                    <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        By {item.donorName}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={14} /> {item.location ? item.location : item.distance}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Package size={14} /> {item.quantity || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: item.isUrgent && item.status === 'Available' ? '#fef2f2' : '#f8fafc',
                                color: item.isUrgent && item.status === 'Available' ? '#ef4444' : '#475569',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: item.isUrgent ? 600 : 500
                            }}>
                                <Clock size={16} /> {item.time}
                            </div>

                            {item.status === 'Available' ? (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <button
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', borderRadius: '9999px', border: 'none', padding: '0.6rem', fontWeight: 600 }}
                                        onClick={() => handleClaim(item.id)}
                                    >
                                        Claim
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '0.6rem 1rem', borderRadius: '9999px', color: '#ef4444', borderColor: '#ef4444', fontWeight: 600, backgroundColor: 'transparent' }}
                                        onClick={() => handleReport(item)}
                                    >
                                        Report
                                    </button>
                                </div>
                            ) : canTrack ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn" disabled style={{ flex: 1, display: 'flex', gap: '0.25rem', justifyContent: 'center', padding: '0.6rem', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '9999px', fontWeight: 600 }}>
                                            <CheckCircle size={18} />
                                            {isPickedUp ? 'Rescued' : 'Claimed'}
                                        </button>
                                        <button className="btn" onClick={() => setTrackingItem({ ...item, pickedUp: isPickedUp })} style={{ flex: 1, padding: '0.6rem', backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '9999px', fontWeight: 600 }}>
                                            Track Status
                                        </button>
                                    </div>
                                    {!isPickedUp && isClaimedByMe && (
                                        <button onClick={() => handleUnclaim(item.id)} className="btn" style={{ width: '100%', padding: '0.4rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #ef4444', borderRadius: '9999px', fontWeight: 600, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            Unclaim Donation
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className="btn" disabled
                                    style={{ width: '100%', marginTop: 'auto', borderRadius: '9999px', padding: '0.6rem', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600 }}
                                >
                                    {isClaimedByOther && item.claimedBy ? `Claimed by ${item.claimedBy}` : item.status}
                                </button>
                            )}
                        </div>
                    );
                })}

                {displayItems.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>No donations match your search criteria.</p>
                    </div>
                )}
            </div>

            {/* Info Modal Overlay */}
            {selectedItem && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem', padding: '2rem', borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Donation Details</h3>
                            <button onClick={() => setSelectedItem(null)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Food Item</div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedItem.title}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Donor Organization</div>
                                <div style={{ fontWeight: 500, color: '#10b981' }}>{selectedItem.donorName || 'External Donor'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Contact Number</div>
                                <div style={{ color: '#0f172a' }}>{selectedItem.contact || 'No contact provided'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Pickup Location</div>
                                <div style={{ color: '#0f172a' }}>{selectedItem.location || selectedItem.distance}</div>
                            </div>

                            {/* Live Tracking Map View */}
                            <div style={{ marginTop: '0.25rem', width: '100%', height: '140px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
                                <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedItem.location || selectedItem.distance || "San Francisco")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}></iframe>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Timing Details</div>
                                <div style={{ color: '#0f172a' }}>{selectedItem.time}</div>
                                <div style={{ color: '#0f172a' }}>{selectedItem.expiry}</div>
                            </div>

                            {(selectedItem.status === 'Claimed' || selectedItem.status === 'PickedUp') && selectedItem.claimedBy && (
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Claimed By</div>
                                    <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{selectedItem.claimedBy}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <button className="btn" style={{ width: '100%', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }} onClick={() => setSelectedItem(null)}>Close Details</button>

                                {selectedItem.claimed_by_id == currentUser?.id && selectedItem.status !== 'PickedUp' && selectedItem.status !== 'Rescued' && (
                                    <button onClick={() => handleUnclaim(selectedItem.id)} className="btn" style={{ width: '100%', backgroundColor: 'transparent', color: '#ef4444', border: '1px dashed #ef4444', borderRadius: '9999px', fontWeight: 600, padding: '0.5rem' }}>
                                        Unclaim Donation
                                    </button>
                                )}

                                <button onClick={() => handleReport(selectedItem)} style={{ width: '100%', backgroundColor: 'transparent', color: '#ef4444', border: 'none', fontWeight: 600, fontSize: '0.875rem', padding: '0.5rem', cursor: 'pointer' }}>
                                    Report Issue with Donation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tracking Modal Overlay */}
            {trackingItem && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', margin: '2rem', padding: '2rem', borderRadius: '1rem', border: 'none', backgroundColor: 'var(--surface-white)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Donation Tracking</h3>
                            <button onClick={() => setTrackingItem(null)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div style={{ padding: '1rem', backgroundColor: 'var(--surface-gray)', borderRadius: '0.5rem' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{trackingItem.title}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tracking Code: #{trackingItem.id.toString().slice(-6)}</div>
                            </div>

                            <div style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                    <Users size={16} className="text-muted" /> Claimed By: <span style={{ color: 'var(--primary-600)' }}>{trackingItem.claimedBy || 'Unknown Recipient'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                    <Phone size={16} className="text-muted" /> Donor Contact: {trackingItem.contact || 'N/A'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                    <MapPin size={16} className="text-muted" /> Live Location: {trackingItem.location || trackingItem.distance}
                                </div>

                                {/* Live Tracking Map View */}
                                <div style={{ marginTop: '0.25rem', width: '100%', height: '160px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
                                    <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(trackingItem.location || trackingItem.distance || "San Francisco")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}></iframe>
                                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', backgroundColor: 'var(--surface-white)', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary-600)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span> LIVE GPs
                                    </div>
                                </div>
                            </div>

                            <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #bbf7d0', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)' }}></div>
                                    <div style={{ fontWeight: 600, color: '#10b981' }}>Donation Claimed</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>You successfully claimed this rescue.</div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: trackingItem.pickedUp ? '#10b981' : 'var(--surface-white)', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)', border: trackingItem.pickedUp ? 'none' : '3px solid #10b981', boxShadow: trackingItem.pickedUp ? 'none' : '0 0 0 2px var(--surface-white)' }}></div>
                                    <div style={{ fontWeight: 600, color: trackingItem.pickedUp ? '#10b981' : 'var(--text-main)' }}>Awaiting Pickup</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Proceed to {trackingItem.location || trackingItem.distance} before {trackingItem.time}.</div>
                                </div>
                                <div style={{ position: 'relative', opacity: trackingItem.pickedUp ? 1 : 0.5 }}>
                                    <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: trackingItem.pickedUp ? 'var(--surface-white)' : 'var(--border-light)', border: trackingItem.pickedUp ? '3px solid #10b981' : 'none', boxShadow: trackingItem.pickedUp ? '0 0 0 2px var(--surface-white)' : 'none', left: '-1.5rem', top: '4px', transform: 'translateX(-5px)' }}></div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Completed</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Food securely rescued!</div>
                                </div>
                            </div>

                            {!trackingItem.pickedUp && (
                                <button className="btn" style={{ width: '100%', marginTop: '0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }} onClick={() => handleCompleteRescue(trackingItem.id)}>
                                    <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Complete Rescue
                                </button>
                            )}

                            <button className="btn" style={{ width: '100%', marginTop: trackingItem.pickedUp ? '1rem' : '0', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '9999px', border: 'none', fontWeight: 600, padding: '0.75rem' }} onClick={() => setTrackingItem(null)}>
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
