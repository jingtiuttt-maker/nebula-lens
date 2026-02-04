import React from 'react';
import { AppState } from '../types';
import { LayoutGrid, User, Plus } from 'lucide-react';

interface BottomNavProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  onCreate: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ appState, setAppState, onCreate }) => {
  // Navigation should be hidden when in Creation mode, except maybe a back button which is handled elsewhere
  if (appState === AppState.CREATION) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8">
      {appState === AppState.HOME && (
        <button 
          onClick={() => setAppState(AppState.PROJECTS)}
          className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center gap-2 group"
        >
          <LayoutGrid size={18} className="group-hover:text-cyan-400 transition-colors" />
          <span className="font-medium tracking-wide">作品 (Gallery)</span>
        </button>
      )}

      <button 
        onClick={onCreate}
        className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(34,211,238,0.7)] hover:scale-110 transition-all duration-300 z-10 group"
      >
        <Plus size={36} className="text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {appState === AppState.HOME && (
        <button 
          className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-8 py-3 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center gap-2 group"
        >
          <User size={18} className="group-hover:text-purple-400 transition-colors" />
          <span className="font-medium tracking-wide">我的 (Me)</span>
        </button>
      )}
    </div>
  );
};

export default BottomNav;