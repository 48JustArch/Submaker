'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Clock, Wrench } from 'lucide-react';

export default function MaintenanceScreen() {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl"
            >
                <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                    <Wrench className="w-10 h-10 text-amber-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    Under Maintenance
                </h1>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    We're currently upgrading the Submaker engine to bring you new features.
                    Access is temporarily restricted.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-black/20 rounded-full py-2 px-4 mx-auto w-fit border border-white/5">
                    <Clock className="w-4 h-4" />
                    <span>Expected duration: ~30 minutes</span>
                </div>
            </motion.div>

            {/* Admin Bypass Hint (Hidden visually but accessible) */}
            <p className="absolute bottom-8 text-xs text-gray-800">
                Admins can bypass via /login
            </p>
        </div>
    );
}
