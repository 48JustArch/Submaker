'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Power, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

interface MaintenanceToggleProps {
    initialEnabled: boolean;
}

export default function MaintenanceToggle({ initialEnabled }: MaintenanceToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const handleToggle = async () => {
        const newValue = !enabled;

        const confirmed = await confirm({
            title: newValue ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?',
            message: newValue
                ? 'This will block access for all non-admin users. Only you will be able to access the site.'
                : 'This will restore public access to the application.',
            confirmText: newValue ? 'Enable Maintenance' : 'Go Live',
            cancelText: 'Cancel',
            variant: newValue ? 'danger' : 'info'
        });

        if (!confirmed) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'maintenance_mode',
                    value: { enabled: newValue }
                });

            if (error) throw error;

            setEnabled(newValue);
            showToast('success', `Maintenance mode ${newValue ? 'ENABLED' : 'DISABLED'}`);
        } catch (error) {
            console.error('Failed to toggle maintenance mode:', error);
            showToast('error', 'Failed to update system settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${enabled ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                        <Power className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Maintenance Mode</h3>
                        <p className="text-sm text-gray-400">
                            {enabled ? 'System is locked. Users cannot access.' : 'System is live and accessible.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${enabled ? 'bg-red-500 focus:ring-red-500' : 'bg-gray-700 focus:ring-gray-700'
                        }`}
                >
                    <span
                        className={`${enabled ? 'translate-x-7' : 'translate-x-1'
                            } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>

            {enabled && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-400 text-sm">Vital Warning</h4>
                        <p className="text-xs text-red-300/80 mt-1">
                            While enabled, all non-admin traffic is blocked. Ensure you complete your updates quickly to minimize downtime.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
