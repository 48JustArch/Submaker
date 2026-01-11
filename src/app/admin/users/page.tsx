'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleUserBan } from '@/lib/supabase/sessions';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Search, Shield, ShieldAlert, User, MoreVertical, Ban, CheckCircle } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
    plan: string;
    generations_used: number;
    generations_limit: number;
    created_at: string;
    is_banned: boolean;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
            } else {
                setUsers(data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBanToggle = async (userId: string, currentStatus: boolean) => {
        const success = await toggleUserBan(userId, !currentStatus);
        if (success) {
            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_banned: !currentStatus } : u
            ));
        } else {
            alert('Failed to update ban status. Ensure you are an admin.');
        }
    };

    const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 bg-[#141414] rounded-xl hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">User Management</h1>
                            <p className="text-gray-500 text-sm">Monitor and control user access</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#141414] text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Plan / Usage</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full bg-white/5 object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                                                            {user.name?.[0] || user.email?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">{user.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/5 w-fit text-gray-300 uppercase">
                                                        {user.plan || 'Free'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {user.generations_used} / {user.generations_limit} gens
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_banned ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                                        <Ban className="w-3 h-3" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleBanToggle(user.id, user.is_banned)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${user.is_banned
                                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                        }`}
                                                >
                                                    {user.is_banned ? 'Unban User' : 'Ban Access'}
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
