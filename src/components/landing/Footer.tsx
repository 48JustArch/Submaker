'use client';

import Link from 'next/link';
import { Twitter, Youtube, Instagram, Mail } from 'lucide-react';

export default function Footer() {
    return (

        <footer className="py-12 md:py-16 px-4 md:px-6 border-t border-white/5 bg-[#050505]">
            <div className="max-w-7xl mx-auto">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 md:mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 text-white font-bold tracking-tighter mb-4">
                            <div className="w-3 h-3 bg-white rounded-full" />
                            Submaker
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            The precision instrument for subconscious programming. Design your reality.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <Youtube className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <Instagram className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/studio" className="text-gray-500 hover:text-white transition-colors">Studio</Link></li>
                            <li><Link href="#pricing" className="text-gray-500 hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/login" className="text-gray-500 hover:text-white transition-colors">Login</Link></li>
                            <li><Link href="/signup" className="text-gray-500 hover:text-white transition-colors">Sign Up</Link></li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Tutorials</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Support</a></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-gray-500 hover:text-white transition-colors">Refund Policy</a></li>
                            <li><a href="mailto:support@submaker.app" className="text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Contact
                            </a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                        © {new Date().getFullYear()} Submaker Inc. All rights reserved.
                    </div>
                    <div className="text-xs text-gray-700">
                        Built for the awakened mind ✦
                    </div>
                </div>
            </div>
        </footer>
    );
}
