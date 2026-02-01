import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, Mail, Shield, MapPin, Search, RefreshCw, Trash2, Edit, X, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
    const { API_BASE_URL, getAuthHeaders, t } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleEditClick = (user) => {
        setSelectedUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            setIsSaving(true);
            setIsSaving(true);

            // Sanitize payload: valid strings or null (not empty strings)
            const payload = {
                name: selectedUser.name,
                role: selectedUser.role,
                country: selectedUser.country?.trim() || null,
                managed_country: selectedUser.managed_country?.trim() || null
            };

            const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("User updated successfully");
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                const error = await response.json();
                console.error("Update user error:", error);
                toast.error(error.detail || "Failed to update user. Please check your inputs.");
            }
        } catch (error) {
            console.error("Update request failed:", error);
            toast.error("An error occurred during update");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });

            if (response.ok) {
                toast.success("User deleted successfully");
                fetchUsers();
            } else {
                toast.error("Failed to delete user");
            }
        } catch (error) {
            toast.error("Connection failed");
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Managed Country</th>
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
                                                    {u.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{u.name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                                        <Mail size={10} /> {u.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                                                ${u.role?.toLowerCase() === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    u.role?.toLowerCase() === 'country_admin' ? 'bg-primary/10 text-primary border border-primary/20' :
                                                        'bg-slate-700/20 text-slate-400 border border-white/5'}`}>
                                                <Shield size={12} />
                                                {u.role?.replace('_', ' ') || 'User'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                                                <MapPin size={14} className="text-slate-500" />
                                                {u.country || 'Global'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                                                <Globe size={14} className="text-primary" />
                                                {u.managed_country || 'None'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(u)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                >
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

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                            <div>
                                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Edit <span className="text-primary">User</span></h2>
                                <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    value={selectedUser.name}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Role</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none"
                                        value={selectedUser.role}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                    >
                                        <option value="advertiser">Advertiser</option>
                                        <option value="admin">Super Admin</option>
                                        <option value="country_admin">Country Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location Country</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. US, TH, GB"
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium uppercase"
                                        value={selectedUser.country || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, country: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Managed Country (For Sub-Admins)</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter country code (e.g. US, TH, GB) for sub-admin focus"
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium uppercase"
                                        value={selectedUser.managed_country || ''}
                                        onChange={(e) => setSelectedUser({ ...selectedUser, managed_country: e.target.value.toUpperCase() })}
                                        disabled={selectedUser.role !== 'country_admin'}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium ml-1">Only applicable for Country Admin role. Limits their dashboard to this specific country.</p>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-900 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/80 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
