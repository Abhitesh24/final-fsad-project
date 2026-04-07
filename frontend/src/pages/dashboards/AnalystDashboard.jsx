import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DownloadCloud, FileText, BarChart2, PieChart as PieChartIcon, Activity, Table as TableIcon, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalystDashboard() {
    const { listings } = useOutletContext();
    const [organizations, setOrganizations] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line', 'table'
    const reportRef = useRef(null);

    React.useEffect(() => {
        const fetchOrgs = async () => {
            try {
                // The actual backend route is /api/orgs
                const res = await axios.get('http://localhost:3001/api/orgs');
                setOrganizations(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchOrgs();
    }, []);

    // 1. Basic Stats
    const totalListings = listings.length;
    const successfulListings = listings.filter(l => l.status === 'PickedUp').length;
    const failedListings = listings.filter(l => l.status === 'Failed' || l.status === 'Spoiled' || l.status === 'Redirected').length;
    const availableListings = listings.filter(l => l.status === 'Available').length;

    // 2. High Level KPIs
    const rescueEfficiency = totalListings > 0 ? ((successfulListings / totalListings) * 100).toFixed(1) : 0;
    const wasteRate = totalListings > 0 ? ((failedListings / totalListings) * 100).toFixed(1) : 0;
    const totalClaimed = listings.filter(l => l.status === 'Claimed' || l.status === 'PickedUp').length;
    const claimConversionRate = availableListings === 0 && totalClaimed > 0 ? 100 : (availableListings > 0 ? ((totalClaimed / availableListings) * 100).toFixed(1) : 0);

    // 3. Monthly Trend Chart
    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
        let d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        monthlyData.push({
            name: monthNames[d.getMonth()] + " '" + d.getFullYear().toString().slice(-2),
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            total: 0,
            successful: 0
        });
    }

    listings.forEach(listing => {
        const listingDate = listing.created_at ? new Date(listing.created_at) : null;
        if (!listingDate) return;
        const monthMatch = monthlyData.find(m => m.monthIndex === listingDate.getMonth() && m.year === listingDate.getFullYear());
        if (monthMatch) {
            monthMatch.total += 1;
            if (listing.status === 'PickedUp') monthMatch.successful += 1;
        }
    });

    // 4. Sub-Analysis (Top Donors and Heatmap)
    const donorVolumeMap = {};
    const locationWasteMap = {};
    const locationTotalMap = {};

    listings.forEach(l => {
        const dName = l.donorName || 'Unknown Donor';
        if (!donorVolumeMap[dName]) donorVolumeMap[dName] = { name: dName, total: 0, success: 0 };
        donorVolumeMap[dName].total += 1;
        if (l.status === 'PickedUp') donorVolumeMap[dName].success += 1;

        const loc = l.location ? l.location.trim().toLowerCase() : 'unknown';
        if (loc !== 'unknown') {
            locationTotalMap[loc] = (locationTotalMap[loc] || 0) + 1;
            if (l.status === 'Failed' || l.status === 'Spoiled' || l.status === 'Redirected') {
                locationWasteMap[loc] = (locationWasteMap[loc] || 0) + 1;
            }
        }
    });

    const topDonors = Object.values(donorVolumeMap).sort((a, b) => b.total - a.total).slice(0, 3);
    const topLocationArr = Object.entries(locationTotalMap).sort((a, b) => b[1] - a[1]);
    const highestDonationArea = topLocationArr.length > 0 ? topLocationArr[0][0] : 'None';
    const wasteLocationArr = Object.entries(locationWasteMap).sort((a, b) => b[1] - a[1]);
    const highestWasteArea = wasteLocationArr.length > 0 ? wasteLocationArr[0][0] : 'None';

    // 5. Distribution Data for Pie Chart
    const distributionData = Object.keys(donorVolumeMap).map(k => ({
        name: k,
        value: donorVolumeMap[k].total
    }));
    if (distributionData.length === 0) distributionData.push({ name: 'No Data', value: 1 });

    const handleGeneratePDF = () => {
        setGenerating(true);
        const element = reportRef.current;
        const opt = {
            margin: 0.5,
            filename: 'Ecoshare_Impact_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setGenerating(false);
        });
    };

    const handleDownloadCSV = () => {
        // Create CSV Header
        let csvContent = "data:text/csv;charset=utf-8,Month,Rescued Quantity (Items),Target Quantity (Items),Variance\n";

        // Add Rows
        monthlyData.forEach(row => {
            const variance = row.volume - row.target;
            csvContent += `${row.name},${row.volume},${row.target},${variance > 0 ? '+' : ''}${variance}\n`;
        });

        // Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Ecoshare_Monthly_Data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Waste Trends & Impact Analysis</h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Real-time data-driven insights from platform activity.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn" onClick={handleDownloadCSV} style={{ backgroundColor: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '9999px', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0.5rem 1rem' }}>
                        <FileText size={16} style={{ marginRight: '0.5rem' }} /> Export CSV
                    </button>
                    <button className="btn" onClick={handleGeneratePDF} disabled={generating} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '9999px', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0.5rem 1rem' }}>
                        <DownloadCloud size={16} style={{ marginRight: '0.5rem' }} />
                        {generating ? 'Exporting PDF...' : 'Download PDF Report'}
                    </button>
                </div>
            </div>

            {/* Content to be exported to PDF */}
            <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'transparent' }}>

                {/* Live Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Listings</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{totalListings}</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                        <div style={{ color: '#16a34a', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Successful Rescues</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a', lineHeight: 1 }}>{successfulListings}</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                        <div style={{ color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Failed / Wasted</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>{failedListings}</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                        <div style={{ color: '#2563eb', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Listings</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>{availableListings}</div>
                    </div>
                </div>

                {/* Advanced KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Rescue Efficiency Rate</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: rescueEfficiency > 50 ? '#16a34a' : '#f59e0b' }}>{rescueEfficiency}%</div>
                    </div>
                    <div className="card" style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Waste Rate</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: wasteRate > 20 ? '#dc2626' : '#16a34a' }}>{wasteRate}%</div>
                    </div>
                    <div className="card" style={{ padding: '1rem 1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Claim Conversion Rate</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>{claimConversionRate}%</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Main Interactive Chart Area */}
                    <div className="card flex flex-col gap-4" style={{ flex: '2 1 500px', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center bg-white">
                            <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Monthly Food Volume Matrix</h4>
                            <div className="flex gap-2" style={{ border: '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '9999px' }}>
                                <button className="btn" style={{ padding: '0.25rem 0.5rem', border: 'none', background: chartType === 'bar' ? '#10b981' : 'transparent', borderRadius: '9999px', color: chartType === 'bar' ? 'white' : '#64748b' }} onClick={() => setChartType('bar')} title="Bar Chart"><BarChart2 size={16} /></button>
                                <button className="btn" style={{ padding: '0.25rem 0.5rem', border: 'none', background: chartType === 'line' ? '#10b981' : 'transparent', borderRadius: '9999px', color: chartType === 'line' ? 'white' : '#64748b' }} onClick={() => setChartType('line')} title="Line Chart"><Activity size={16} /></button>
                                <button className="btn" style={{ padding: '0.25rem 0.5rem', border: 'none', background: chartType === 'pie' ? '#10b981' : 'transparent', borderRadius: '9999px', color: chartType === 'pie' ? 'white' : '#64748b' }} onClick={() => setChartType('pie')} title="Pie Chart"><PieChartIcon size={16} /></button>
                                <button className="btn" style={{ padding: '0.25rem 0.5rem', border: 'none', background: chartType === 'table' ? '#10b981' : 'transparent', borderRadius: '9999px', color: chartType === 'table' ? 'white' : '#64748b' }} onClick={() => setChartType('table')} title="Data Table"><TableIcon size={16} /></button>
                            </div>
                        </div>

                        <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
                            {chartType === 'bar' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', backgroundColor: 'white' }} />
                                        <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                                        <Bar dataKey="total" name="Total Listings" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="successful" name="Rescued (Items)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}

                            {chartType === 'line' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', backgroundColor: 'white' }} />
                                        <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                                        <Line type="monotone" dataKey="total" name="Total Listings" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        <Line type="monotone" dataKey="successful" name="Rescued (Items)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}

                            {chartType === 'pie' && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', backgroundColor: 'white' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}

                            {chartType === 'table' && (
                                <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '1rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Month</th>
                                                <th style={{ padding: '1rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Total Listings</th>
                                                <th style={{ padding: '1rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Rescued Quantity</th>
                                                <th style={{ padding: '1rem 0.75rem', color: '#64748b', fontWeight: 600 }}>Variance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyData.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem 0.75rem', fontWeight: 500, color: '#0f172a' }}>{row.name}</td>
                                                    <td style={{ padding: '1rem 0.75rem', color: '#475569' }}>{row.total}</td>
                                                    <td style={{ padding: '1rem 0.75rem', color: '#475569' }}>{row.successful}</td>
                                                    <td style={{ padding: '1rem 0.75rem', color: row.successful >= row.total ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                                        {row.successful - row.total}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary Insights */}
                    <div className="flex flex-col gap-6" style={{ flex: '1 1 300px' }}>
                        <div className="card" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Platform User Distribution</h4>
                            <div className="flex flex-col gap-5">
                                {[
                                    { label: 'Verified Donors', count: organizations.filter(o => o.type === 'Donor' && o.status === 'Approved').length, color: '#10b981' },
                                    { label: 'Verified Recipients', count: organizations.filter(o => o.type === 'Recipient' && o.status === 'Approved').length, color: '#3b82f6' },
                                    { label: 'Pending Approvals', count: organizations.filter(o => o.status === 'Pending').length, color: '#f59e0b' },
                                ].map(item => {
                                    const pct = organizations.length > 0 ? (item.count / organizations.length) * 100 : 0;
                                    return (
                                        <div key={item.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 600, color: '#475569' }}>{item.label}</span>
                                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.count}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '9999px', transition: 'width 1s ease-out' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Predictive Forecast & Actionable Insights */}
                        <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="flex justify-between items-center mb-4">
                                <h4 style={{ color: '#166534', margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Forecast & Insights</h4>
                                <AlertTriangle size={20} color="#166534" />
                            </div>

                            <div className="flex flex-col gap-4">
                                {(() => {
                                    // Calculate simple trend based on the last two months of data
                                    if (monthlyData.length >= 2) {
                                        const lastMonth = monthlyData[monthlyData.length - 1];
                                        const prevMonth = monthlyData[monthlyData.length - 2];

                                        // Avoid division by zero
                                        if (prevMonth.volume > 0) {
                                            const percentChange = ((lastMonth.volume - prevMonth.volume) / prevMonth.volume) * 100;

                                            return (
                                                <>
                                                    {percentChange < -10 && (
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #dcfce7' }}>
                                                            <div style={{ padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: '#dc2626', marginTop: '0.25rem' }}>
                                                                <TrendingDown size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>Predicted Spoilage Alert</div>
                                                                <div style={{ fontSize: '0.875rem', color: '#b91c1c', lineHeight: 1.5 }}>
                                                                    Based on the {Math.abs(percentChange).toFixed(1)}% drop from {prevMonth.name} to {lastMonth.name}, expect an increased risk of spoilage if targeted collection isn't organized. Consider reminding Donors to list early.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {percentChange > 10 && (
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #dcfce7' }}>
                                                            <div style={{ padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem', color: '#16a34a', marginTop: '0.25rem' }}>
                                                                <TrendingUp size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.25rem' }}>High Volume Forecast</div>
                                                                <div style={{ fontSize: '0.875rem', color: '#166534', lineHeight: 1.5 }}>
                                                                    Rescued items grew by {percentChange.toFixed(1)}% this month. Ensure sufficient Recipient capacity is available for the projected {Math.round(lastMonth.volume * 1.05)} items next month.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {Math.abs(percentChange) <= 10 && (
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #dcfce7' }}>
                                                            <div style={{ padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem', color: '#2563eb', marginTop: '0.25rem' }}>
                                                                <Activity size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.25rem' }}>Stable Market Status</div>
                                                                <div style={{ fontSize: '0.875rem', color: '#1e40af', lineHeight: 1.5 }}>
                                                                    Platform volume is stable with only a {Math.abs(percentChange).toFixed(1)}% fluctuation. Continue normal recruitment and verification operations.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        }
                                    }

                                    // Fallback if not enough data
                                    return (
                                        <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                                            Collecting more monthly data to generate predictive insights...
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
