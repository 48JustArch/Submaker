'use client';

import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConfirmState | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                ...options,
                isOpen: true,
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state?.resolve(true);
        setState(null);
    }, [state]);

    const handleCancel = useCallback(() => {
        state?.resolve(false);
        setState(null);
    }, [state]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {state?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={handleCancel}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 flex items-start gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                    ${state.variant === 'danger' ? 'bg-red-500/10 text-red-500' :
                                        state.variant === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-blue-500/10 text-blue-500'}
                                `}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-white mb-1">{state.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{state.message}</p>
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-colors"
                                >
                                    {state.cancelText || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`
                                        flex-1 py-3 px-4 font-bold rounded-xl transition-colors
                                        ${state.variant === 'danger'
                                            ? 'bg-red-600 hover:bg-red-500 text-white'
                                            : state.variant === 'warning'
                                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white'}
                                    `}
                                >
                                    {state.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
