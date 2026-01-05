import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
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
        { name: 'Mobile', value: 65, color: '#3b82f6' },
        { name: 'Desktop', value: 25, color: '#8b5cf6' },
        { name: 'Tablet', value: 10, color: '#10b981' },
    ];

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Performance Analytics Report', 14, 15);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

        autoTable(doc, {
            head: [['Day', 'Impressions', 'Clicks', 'CTR (%)', 'Cost ($)']],
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Performance Analytics</h1>
                    <p className="text-slate-400 mt-1">Deep dive into your campaign metrics with live updates.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-700 text-slate-200 transition-colors">
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-blue-900/20">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">

                {/* 1. CTR Trends (Live) */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm min-w-0">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">CTR Trends (Live)</h3>
                    <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 6]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="CTR %" animationDuration={1000} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Impressions */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">Daily Impressions</h3>
                    <div className="h-[250px] md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                                <Bar dataKey="imp" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Impressions" animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Budget Utilization */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">Budget Utilization</h3>
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
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} />
                                <Area type="monotone" dataKey="budget" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBudget)" name="Budget Used" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Traffic by Device */}
                <div className="glass-panel p-5 md:p-6 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-slate-100 italic uppercase tracking-widest mb-6 px-1">Traffic Share</h3>
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
                                <p className="text-2xl md:text-3xl font-black text-white italic">65%</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mobile</p>
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
