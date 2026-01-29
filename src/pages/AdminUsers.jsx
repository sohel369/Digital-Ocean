import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Mail, Shield, MapPin, Search, RefreshCw, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
    const { API_BASE_URL, getAuthHeaders, t } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { ...getAuthHeaders() }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                toast.error("Failed to fetch users");
            }
        } catch (error) {
            console.error("Fetch users error:", error);
            toast.error("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        User <span className="text-primary">Directory</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-sm mt-3">Manage platform access, roles, and country assignments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="p-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition-all border border-white/5"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b border-white/5">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Profile</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Role</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Industry</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-6">
                                            <div className="h-4 bg-slate-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold border border-white/10">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{u.name}</span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                                        <Mail size={10} /> {u.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                                                ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    u.role === 'country_admin' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                        'bg-slate-700/20 text-slate-400 border border-white/5'}`}>
                                                <Shield size={12} />
                                                {u.role.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                                                <MapPin size={14} className="text-slate-500" />
                                                {u.managed_country || u.country || 'Global'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.industry || 'General'}</span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest italic">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
