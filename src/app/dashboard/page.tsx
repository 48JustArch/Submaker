'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, PlayCircle, Download, LogOut, Settings, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getUserSessions, ensureUserProfile, deleteSession, type AudioGeneration, type UserProfile } from '@/lib/supabase/sessions';
import { isAdminEmail } from '@/lib/config';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

export default function Dashboard() {
    const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessions, setSessions] = useState<AudioGeneration[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        async function loadData() {
            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/login');
                return;
            }

            setUser(authUser);

            // Ensure user profile exists (create if missing), then load sessions
            const userProfile = await ensureUserProfile(
                authUser.id,
                authUser.email || '',
                authUser.user_metadata?.full_name,
                authUser.user_metadata?.avatar_url
            );
            const userSessions = await getUserSessions(authUser.id);

            setProfile(userProfile);
            setSessions(userSessions);
            setLoading(false);
        }

        loadData();
    }, [router, supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getUserName = () => {
        if (profile?.name) return profile.name;
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
        return 'Creator';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleDownload = (session: AudioGeneration) => {
        if (session.audio_url) {
            const link = document.createElement('a');
            link.href = session.audio_url;
            link.download = `${session.title}.${session.audio_type || 'mp3'}`;
            link.click();
        }
    };

    const handleDelete = async (sessionId: string) => {
        const confirmed = await confirm({
            title: 'Delete Session',
            message: 'Are you sure you want to delete this session? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Keep It',
            variant: 'danger'
        });

        if (confirmed) {
            const success = await deleteSession(sessionId);
            if (success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                showToast('success', 'Session deleted successfully');
            } else {
                showToast('error', 'Failed to delete session');
            }
        }
    };

    const canCreateNew = () => {
        // Limit to 3 active drafts
        const draftCount = sessions.filter(s => s.status === 'draft' && !s.is_closed).length;
        if (draftCount >= 3) return false;

        // Check if user exceeded their exports limit (free plan)
        if (profile && profile.plan === 'free') {
            if (profile.generations_used >= profile.generations_limit) return false;
        }

        return true;
    };

    const getCreateBlockReason = () => {
        const draftCount = sessions.filter(s => s.status === 'draft' && !s.is_closed).length;
        if (draftCount >= 3) {
            return 'You have 3 open drafts. Finish or delete one to create new.';
        }
        if (profile && profile.plan === 'free' && profile.generations_used >= profile.generations_limit) {
            return `You've reached your free plan limit (${profile.generations_limit} exports). Upgrade to continue.`;
        }
        return '';
    };

    const isAdmin = isAdminEmail(user?.email);
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Top Navigation */}
            <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3 font-bold text-xl tracking-tighter">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Submaker
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                        <span className="capitalize">{profile?.plan || 'Free'} Plan</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>{profile?.generations_used || 0}/{profile?.generations_limit || 3} Generations</span>
                    </div>

                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                            title="Admin Panel"
                        >
                            <Shield className="w-5 h-5" />
                        </Link>
                    )}

                    <button
                        onClick={handleSignOut}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>

                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-9 h-9 rounded-full border border-white/10 object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 border border-white/10 flex items-center justify-center text-sm font-bold">
                            {getUserName().charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-8 space-y-12">
                {/* Welcome Section */}
                <section>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-2"
                    >
                        {getGreeting()}, {getUserName()}.
                    </motion.h1>
                    <p className="text-gray-500">Ready to engineer your reality?</p>
                </section>

                {/* New Session Card */}
                <section>
                    {canCreateNew() ? (
                        <Link href="/studio" className="group relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 hover:border-white/20 transition-all block" aria-label="Create new session">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Plus className="w-32 h-32 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-black">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">New Session</h2>
                                <p className="text-gray-500">Start a new audio engineering project from scratch.</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="rounded-3xl bg-[#0a0a0a] border border-amber-500/20 p-8" role="alert">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-amber-400">Session Limit Reached</h2>
                                    <p className="text-gray-500">{getCreateBlockReason()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Recent Projects */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Recent Projects</h2>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        {sessions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No projects yet. Create your first session!
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                            <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{session.title || 'Untitled Session'}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatDate(session.created_at)}</span>
                                                {session.audio_type && (
                                                    <>
                                                        <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                                        <span className="uppercase">{session.audio_type}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border
                                            ${session.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                session.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    session.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        session.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            'bg-gray-500/10 text-gray-500 border-white/5'}`}>
                                            {session.status === 'completed' ? 'Done' :
                                                session.status === 'draft' ? 'Draft' :
                                                    session.status === 'processing' ? 'Processing' :
                                                        session.status === 'failed' ? 'Failed' : session.status}
                                        </span>

                                        {session.is_closed && session.audio_url ? (
                                            <button
                                                onClick={() => handleDownload(session)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-green-500 hover:text-green-400 transition-colors flex items-center gap-2"
                                                title="Download Audio"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        ) : !session.is_closed ? (
                                            <Link
                                                href={`/studio?session=${session.id}`}
                                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                                            >
                                                Continue
                                            </Link>
                                        ) : null}

                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
