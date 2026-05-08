import { Zap, History } from 'lucide-react';

type Screen = 'home' | 'history' | 'detail';

interface NavbarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Navbar({ activeScreen, onNavigate }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-base tracking-tight">SiteSnap AI</span>
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeScreen === 'history'
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <History size={15} />
          History
        </button>
      </div>
    </nav>
  );
}
