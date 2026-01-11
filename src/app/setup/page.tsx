import { AlertTriangle, Check, Copy } from 'lucide-react'

export default function SetupPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h1 className="text-3xl font-bold">Configuration Required</h1>
                    <p className="text-gray-400 mt-2">The application needs Supabase credentials to run.</p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">1. Get your Supabase Keys</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Go to your Supabase Project Dashboard &rarr; Project Settings &rarr; API.
                        </p>
                        <div className="bg-black rounded-lg p-4 border border-white/5 space-y-4 font-mono text-sm">
                            <div>
                                <div className="text-gray-500 mb-1">Project URL</div>
                                <div className="text-green-400">https://your-project.supabase.co</div>
                            </div>
                            <div>
                                <div className="text-gray-500 mb-1">Anon Public Key</div>
                                <div className="text-green-400 break-all">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">2. Update .env.local</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Open the file named <code className="bg-white/10 px-1 rounded">.env.local</code> in your project root and paste these values:
                        </p>
                        <div className="bg-black rounded-lg p-4 border border-white/5 overflow-x-auto">
                            <pre className="text-blue-400 select-all">
                                {`NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">3. Restart Server</h2>
                        <p className="text-gray-400 text-sm">
                            After saving the file, you must restart the terminal:
                        </p>
                        <div className="mt-2 bg-black px-3 py-2 rounded border border-white/5 inline-block font-mono text-xs">
                            Ctrl+C then npm run dev
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
