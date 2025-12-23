'use client';

export default function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

                <div className="flex items-center gap-2 text-white font-bold tracking-tighter">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Submaker
                </div>

                <div className="flex gap-8 text-sm text-gray-500">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>

                <div className="text-sm text-gray-600">
                    © {new Date().getFullYear()} Submaker Inc.
                </div>
            </div>
        </footer>
    );
}
