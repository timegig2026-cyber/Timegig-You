import React from 'react';
import { Building2, User } from 'lucide-react';

interface BottomMenuBarProps {
  activeTab: 'tenant' | 'auth';
  onTabChange: (tab: 'tenant' | 'auth') => void;
  userEmail?: string | null;
}

export const BottomMenuBar: React.FC<BottomMenuBarProps> = ({
  activeTab,
  onTabChange,
  userEmail,
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-10px_25px_-5px_rgba(15,23,42,0.1)]"
    >
      <div className="max-w-md mx-auto h-16 grid grid-cols-2 items-center px-4 gap-3">
        {/* Feature 1: Tenant Hub */}
        <button
          id="tenant-feature-btn"
          onClick={() => onTabChange('tenant')}
          type="button"
          className={`flex flex-col items-center justify-center h-12 rounded-xl transition-all ${
            activeTab === 'tenant'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-0.5 ${activeTab === 'tenant' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px]">Tenant</span>
        </button>

        {/* Feature 2: Sign-Up / Login / Account */}
        <button
          id="auth-feature-btn"
          onClick={() => onTabChange('auth')}
          type="button"
          className={`flex flex-col items-center justify-center h-12 rounded-xl transition-all relative ${
            activeTab === 'auth'
              ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className={`w-5 h-5 mb-0.5 ${activeTab === 'auth' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] truncate max-w-[110px]">
            {userEmail ? userEmail.split('@')[0] : 'Sign In / Up'}
          </span>
          {userEmail && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    </nav>
  );
};
