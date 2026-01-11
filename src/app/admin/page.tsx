import { createClient } from '@/lib/supabase/server'
import { Activity, Users, Music, Database, Clock, Mail, Download, FileText, HardDrive } from 'lucide-react'
import Link from 'next/link'
import { getActivityStats } from '@/lib/supabase/activity'
import { getGlobalStorageStats, formatBytes } from '@/lib/supabase/storage'

interface StatsCardProps {
    title: string
    value: string | number
    icon: React.ElementType
    description: string
    color?: string
}

function StatsCard({ title, value, icon: Icon, description, color = 'blue' }: StatsCardProps) {
    const colorClasses: Record<string, string> = {
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    }

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-all hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-4">
                <Icon className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">{title}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-gray-400">{description}</div>
        </div>
    )
}

interface User {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
    plan: string
    generations_used: number
    generations_limit: number
    created_at: string
}

interface AudioGeneration {
    id: string
    title: string
    user_id: string
    status: string
    audio_type: string | null
    created_at: string
    is_closed: boolean
}

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch all data including activity and storage stats
    const [
        { count: usersCount },
        { count: audioCount },
        { data: recentUsers },
        { data: recentGenerations },
        activityStats,
        storageStats
    ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('audio_generations').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('audio_generations').select('*').order('created_at', { ascending: false }).limit(10),
        getActivityStats(),
        getGlobalStorageStats()
    ])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage users and view system status</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-gray-400">System Operational</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                    title="Total Users"
                    value={usersCount || 0}
                    icon={Users}
                    description="Registered accounts"
                    color="blue"
                />
                <StatsCard
                    title="Audio Generations"
                    value={audioCount || 0}
                    icon={Music}
                    description="Total files generated"
                    color="blue"
                />
                <StatsCard
                    title="Activity Today"
                    value={activityStats.totalToday}
                    icon={Activity}
                    description={`${activityStats.totalThisWeek} this week`}
                    color="green"
                />
                <StatsCard
                    title="Storage Used"
                    value={formatBytes(storageStats.totalBytes)}
                    icon={HardDrive}
                    description={`${storageStats.totalFiles} files uploaded`}
                    color="cyan"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <div className="rounded-xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Recent Users
                        </h3>
                        <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 font-bold">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentUsers?.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No users yet
                            </div>
                        ) : (
                            recentUsers?.map((user: User) => (
                                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.name || 'User'}
                                            className="w-10 h-10 rounded-full border border-white/10 object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
                                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{user.name || 'Unnamed'}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs px-2 py-1 rounded-full ${user.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {user.plan || 'free'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {user.generations_used}/{user.generations_limit} used
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl bg-[#0a0a0a] border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Recent Generations
                        </h3>
                        <Link href="/admin/generations" className="text-xs text-blue-400 hover:text-blue-300">
                            View All →
                        </Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {recentGenerations?.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No generations yet
                            </div>
                        ) : (
                            recentGenerations?.map((gen: AudioGeneration) => (
                                <div key={gen.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gen.is_closed ? 'bg-green-500/20' : 'bg-yellow-500/20'
                                        }`}>
                                        <Music className={`w-5 h-5 ${gen.is_closed ? 'text-green-500' : 'text-yellow-500'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{gen.title || 'Untitled Session'}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDate(gen.created_at)}</span>
                                            {gen.audio_type && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span className="uppercase">{gen.audio_type}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${gen.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        gen.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {gen.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
