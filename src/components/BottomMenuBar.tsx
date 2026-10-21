import React from 'react';
import { Building2, User, LogOut } from 'lucide-react';

interface BottomMenuBarProps {
  activeTab: 'tenant' | 'auth';
  onTabChange: (tab: 'tenant' | 'auth') => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

export const BottomMenuBar: React.FC<BottomMenuBarProps> = ({
  activeTab,
  onTabChange,
  userEmail,
  onLogout,
}) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white border-t border-slate-200 shadow-lg"
    >
      <div className="max-w-md mx-auto h-16 grid grid-cols-2 items-center px-4">
        {/* Feature 1: Tenant Hub */}
        <button
          id="tenant-feature-btn"
          onClick={() => onTabChange('tenant')}
          type="button"
          className={`flex flex-col items-center justify-center h-full py-1 text-xs font-medium transition-colors ${
            activeTab === 'tenant'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-1 ${activeTab === 'tenant' ? 'stroke-[2.2]' : 'stroke-2'}`} />
          <span>Tenant</span>
        </button>

        {/* Feature 2: Sign-Up / Login / Account */}
        <button
          id="auth-feature-btn"
          onClick={() => onTabChange('auth')}
          type="button"
          className={`flex flex-col items-center justify-center h-full py-1 text-xs font-medium transition-colors relative ${
            activeTab === 'auth'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className={`w-5 h-5 mb-1 ${activeTab === 'auth' ? 'stroke-[2.2]' : 'stroke-2'}`} />
          <span className="truncate max-w-[120px]">
            {userEmail ? userEmail.split('@')[0] : 'Sign In / Up'}
          </span>
          {userEmail && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    </nav>
  );
};
