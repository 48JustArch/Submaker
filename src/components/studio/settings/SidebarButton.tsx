import { LucideIcon } from 'lucide-react';

interface SidebarButtonProps {
    active: boolean;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}

export function SidebarButton({ active, icon: Icon, label, onClick }: SidebarButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-3 transition-all ${active
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
                }`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
            {label}
        </button>
    );
}
