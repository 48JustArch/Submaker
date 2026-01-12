'use client';

import { motion } from 'framer-motion';
import { Ban, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function BannedPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 max-w-md w-full bg-[#0a0a0a] border border-red-900/30 rounded-3xl p-10 shadow-2xl backdrop-blur-xl"
            >
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <Ban className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Account Suspended</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Your account has been suspended due to a violation of our terms of service. Access to the platform is currently restricted.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.href = 'mailto:support@submaker.com'}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Contact Support
                    </button>
                    <Link
                        href="/"
                        className="w-full py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors block border border-white/5"
                    >
                        Return Home
                    </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-red-400/50 uppercase tracking-widest font-mono">
                    <ShieldAlert className="w-3 h-3" />
                    Security Enforced
                </div>
            </motion.div>
        </div>
    );
}
