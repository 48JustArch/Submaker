import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Only allow admin access for specific email
    if (user.email !== 'damon66.op@gmail.com') {
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
            {/* Sidebar placeholder */}
            <aside className="w-64 border-r border-white/10 bg-[#0a0a0a] p-4 hidden md:block">
                <h2 className="text-xl font-bold mb-6">Submaker Admin</h2>
                <nav className="space-y-2">
                    <a href="/admin" className="block px-4 py-2 rounded-lg bg-white/5 text-white">Overview</a>
                    <a href="/admin/users" className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">Users</a>
                    <a href="/admin/generations" className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">Audio Generations</a>
                    <a href="/studio" className="block px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 mt-8 border-t border-white/10 pt-4">Back to Studio</a>
                </nav>
            </aside>
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
