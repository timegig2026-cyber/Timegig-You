import React from 'react';
import { Building2 } from 'lucide-react';

interface BottomMenuBarProps {
  isActive: boolean;
  onClick: () => void;
}

export const BottomMenuBar: React.FC<BottomMenuBarProps> = ({ isActive, onClick }) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white border-t border-slate-200"
    >
      <div className="max-w-md mx-auto h-16 flex items-center justify-center px-4">
        {/* Only 1 Feature icon called Tenant */}
        <button
          id="tenant-feature-btn"
          onClick={onClick}
          type="button"
          className={`flex flex-col items-center justify-center w-24 h-full py-1 text-xs font-medium transition-colors ${
            isActive
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.2]' : 'stroke-2'}`} />
          <span>Tenant</span>
        </button>
      </div>
    </nav>
  );
};
