import React from 'react';
import { Menu, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMobile: () => void;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobile, title, subtitle }) => {
  const { organization } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg -ml-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {organization && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-full text-xs font-medium text-indigo-700">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold max-w-[150px] sm:max-w-[200px] truncate">
              {organization.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
