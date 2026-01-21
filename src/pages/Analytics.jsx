import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';

const Analytics = () => {
    const { t } = useApp();

    // Simulated Live Data
    const [dailyData, setDailyData] = useState([
        { name: 'Mon', imp: 4000, clicks: 240, cost: 2400, ctr: 3.2, budget: 85 },
        { name: 'Tue', imp: 3000, clicks: 139, cost: 2210, ctr: 4.1, budget: 78 },
        { name: 'Wed', imp: 2000, clicks: 980, cost: 2290, ctr: 3.8, budget: 92 },
        { name: 'Thu', imp: 2780, clicks: 390, cost: 2000, ctr: 2.9, budget: 70 },
        { name: 'Fri', imp: 1890, clicks: 480, cost: 2181, ctr: 3.5, budget: 82 },
        { name: 'Sat', imp: 2390, clicks: 380, cost: 2500, ctr: 4.0, budget: 95 },
        { name: 'Sun', imp: 3490, clicks: 430, cost: 2100, ctr: 3.8, budget: 88 },
    ]);

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setDailyData(prevData => {
                return prevData.map(item => ({
                    ...item,
                    ctr: parseFloat((item.ctr + (Math.random() * 0.4 - 0.2)).toFixed(1)), // Vary CTR slightly
                    imp: Math.max(1000, item.imp + Math.floor(Math.random() * 200 - 100)) // Vary impressions
                }));
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const deviceData = [
        { name: t('campaign.mobile') || 'Mobile', value: 65, color: '#3b82f6' },
        { name: t('campaign.desktop') || 'Desktop', value: 25, color: '#8b5cf6' },
        { name: t('common.tablet') || 'Tablet', value: 10, color: '#10b981' },
    ];

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(t('analytics.title') || 'Performance Analytics Report', 14, 15);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

        autoTable(doc, {
            head: [[t('analytics.day') || 'Day', t('dashboard.impressions'), t('dashboard.total_clicks'), 'CTR (%)', 'Cost ($)']],
            body: dailyData.map(d => [d.name, d.imp, d.clicks, d.ctr, d.cost]),
            startY: 35,
        });

        doc.save('analytics-report.pdf');
    };

    const handleExportCSV = () => {
        const headers = ['Day,Impressions,Clicks,CTR,Cost'];
        const csv = dailyData.map(d => `${d.name},${d.imp},${d.clicks},${d.ctr},${d.cost}`).join('\n');
        const blob = new Blob([headers + '\n' + csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-report.csv';
        a.click();
    };

    // Helper for generating safer labels (no PPC terms)
    const getEngagementLabel = () => t('analytics.ctr_trends') || "Engagement Rate";
    const getReachLabel = () => t('analytics.daily_impressions') || "Daily Visibility";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                        {t('analytics.title')}
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base font-medium">{t('analytics.subtitle')}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-700 text-slate-200 transition-colors">
                        <Download size={16} /> {t('analytics.export_csv')}
                    </button>
                    <button onClick={handleExportPDF} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-blue-900/20">
                        <Download size={16} /> {t('analytics.export_pdf')}
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">

                {/* 1. CTR Trends (Live) */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm min-w-0">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">{t('analytics.ctr_trends')}</h3>
                    <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 6]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    formatter={(value) => [`${value}%`, 'Engagement Rate (Indicativeonly)']}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Eng. Rate %" animationDuration={1000} />
                            </LineChart>
                        </ResponsiveContainer>
                        <p className="text-[10px] text-slate-600 text-center mt-2 italic">* Metrics are indicative and not used for billing.</p>
                    </div>
                </div>

                {/* 2. Impressions */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">{t('analytics.daily_impressions')}</h3>
                    <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                                <Bar dataKey="imp" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('dashboard.impressions')} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">{t('analytics.budget_utilization')}</h3>
                    <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                                <Area type="monotone" dataKey="budget" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" name={t('dashboard.budget')} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Traffic by Device */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">{t('analytics.traffic_share')}</h3>
                    <div className="h-[250px] md:h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    innerRadius="65%"
                                    outerRadius="85%"
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend Overlay Center */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white italic tracking-tighter">65%</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('campaign.mobile')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
                        {deviceData.map((d) => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-tight">{d.name} ({d.value}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
