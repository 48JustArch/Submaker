'use client';

import { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Check, ChevronRight, Camera, Loader2, LogOut, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-8 text-center space-y-8"
        >
            {/* Avatar Section */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-white/10 overflow-hidden relative">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-10 h-10 text-white" />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </div>

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}

                <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center pointer-events-none">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                />
            </div>

            {/* Use Info */}
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-white capitalize">
                    {profile?.name || user?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        {profile?.plan || 'Free'} Plan Active
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 w-full max-w-xs">
                <button
                    disabled
                    className="w-full px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    Manage Subscription <ChevronRight className="w-4 h-4" />
                </button>

                <div className="pt-4 flex items-center justify-center gap-4">
                    <button
                        onClick={handleSignOut}
                        className="text-xs font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-3 h-3" /> Sign Out
                    </button>
                    <div className="w-px h-3 bg-white/10" />
                    <button className="text-xs font-medium text-red-900/50 hover:text-red-500 transition-colors flex items-center gap-2">
                        <Trash2 className="w-3 h-3" /> Delete Account
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
