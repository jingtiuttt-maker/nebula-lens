import React from 'react';
import { Download, Share2, PlayCircle } from 'lucide-react';
import { INITIAL_SHOTS } from '../../constants';

const FinalCutStep: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto">
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-white/10">
        <img src="https://picsum.photos/1920/1080?blur=2" className="w-full h-full object-cover opacity-60" />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
            <button className="transform transition-transform hover:scale-110">
                <PlayCircle size={80} className="text-white/80 hover:text-cyan-400 fill-black/50" />
            </button>
        </div>

        {/* Timeline Preview */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent flex items-end px-6 pb-4 gap-1">
            {INITIAL_SHOTS.map(shot => (
                <div key={shot.id} className="h-10 flex-1 bg-gray-800 rounded-sm overflow-hidden border border-white/10 hover:h-12 transition-all cursor-pointer">
                    <img src={shot.currentVisual} className="w-full h-full object-cover" />
                </div>
            ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-2xl">
        <button className="bg-gray-800 hover:bg-gray-700 text-white p-6 rounded-2xl flex flex-col items-center gap-3 border border-white/5 transition-all group">
            <Download size={32} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="text-center">
                <span className="font-bold block">导出分镜 (Export Clips)</span>
                <span className="text-xs text-gray-400">下载全部分镜文件</span>
            </div>
        </button>

        <button className="bg-gradient-to-br from-cyan-900 to-purple-900 hover:brightness-110 text-white p-6 rounded-2xl flex flex-col items-center gap-3 border border-white/10 transition-all group shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <Share2 size={32} className="text-white group-hover:scale-110 transition-transform" />
            <div className="text-center">
                <span className="font-bold block">渲染并分享 (Render & Share)</span>
                <span className="text-xs text-white/60">导出 4K 完整剧集</span>
            </div>
        </button>
      </div>
    </div>
  );
};

export default FinalCutStep;