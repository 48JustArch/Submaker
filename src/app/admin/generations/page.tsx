import { createClient } from '@/lib/supabase/server'

export default async function AdminGenerationsPage() {
    const supabase = await createClient()
    const { data: generations, error } = await supabase.from('audio_generations').select('*, users(email)').order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8 text-red-500">Error loading generations: {error.message}</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Audio Generations</h1>
            <div className="bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Duration</th>
                            <th className="p-4">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {generations && generations.length > 0 ? (
                            generations.map((gen: any) => (
                                <tr key={gen.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{gen.title || 'Untitled'}</td>
                                    <td className="p-4 text-gray-400">{gen.users?.email || 'Unknown'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold
                                            ${gen.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                gen.status === 'processing' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                            {gen.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{gen.duration_seconds ? `${Math.floor(gen.duration_seconds / 60)}m ${gen.duration_seconds % 60}s` : '--'}</td>
                                    <td className="p-4 text-gray-500">{new Date(gen.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No generations found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
