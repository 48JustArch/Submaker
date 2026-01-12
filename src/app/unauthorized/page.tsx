'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow - Red/Orange */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"
                    >
                        <ShieldX className="w-10 h-10 text-red-500" />
                    </motion.div>
                </div>

                {/* Card */}
                <div className="bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Access Denied
                    </h1>
                    <p className="text-gray-400 mb-8">
                        You don't have permission to access this area. This section is restricted to administrators only.
                    </p>

                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-3 text-sm text-red-400">
                            <Lock className="w-4 h-4 flex-shrink-0" />
                            <span>
                                If you believe this is an error, please contact the system administrator.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/dashboard"
                            className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            href="/"
                            className="w-full py-3 px-6 bg-white/5 text-white border border-white/10 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>

                <p className="text-center mt-8 text-sm text-gray-600">
                    Error Code: 403 | Forbidden
                </p>
            </motion.div>
        </div>
    );
}
