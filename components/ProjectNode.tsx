import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectNodeProps {
  project: Project;
  x: number;
  y: number;
  scale: number;
  delay: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ProjectNode: React.FC<ProjectNodeProps> = ({ project, x, y, scale, delay, onMouseDown, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Simple heuristic to differentiate click vs drag
  const handleMouseDownWrapper = (e: React.MouseEvent) => {
      setIsDragging(false);
      onMouseDown(e);
  };

  const handleMouseMove = () => {
      setIsDragging(true);
  };

  const handleClickWrapper = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDragging) {
          onClick();
      }
  };

  return (
    <div
      className="absolute transition-transform duration-75 ease-linear cursor-grab active:cursor-grabbing group"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%)`, // Position centering
        zIndex: isHovered ? 50 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDownWrapper}
      onMouseMove={handleMouseMove}
    >
      {/* Floating Animation Wrapper (Only animates when not hovered) */}
      <div style={{ animation: isHovered ? 'none' : `float 8s ease-in-out infinite ${delay}s` }}>
        
        {/* The Star Representation - MADE SUBTLE */}
        <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] transition-all duration-500 ease-out ${isHovered ? 'opacity-0 scale-0' : 'opacity-100'}`}
            style={{
                width: `${4 * scale}px`, // Reduced from 12 to 4
                height: `${4 * scale}px`
            }}
        />
        {/* Breathing Ring */}
        <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 transition-all duration-500 ${isHovered ? 'opacity-0 scale-0' : 'opacity-100 animate-pulse'}`}
            style={{
                width: `${24 * scale}px`, // Reduced from 40 to 24
                height: `${24 * scale}px`,
                animationDelay: `${delay}s`
            }}
        />

        {/* The Card Representation (Visible on hover) */}
        <div 
            className={`relative rounded-xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-all duration-500 ease-out origin-center bg-black
            ${isHovered ? 'w-48 opacity-100 scale-110' : 'w-0 h-0 opacity-0 scale-0 pointer-events-none'}
            `}
        >
            <div className="aspect-[2/3] relative">
                <img 
                src={project.thumbnail} 
                alt={project.title} 
                className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            </div>
        
            <div className="absolute bottom-0 left-0 w-full p-4">
                <h3 className="text-white text-sm font-bold font-mono tracking-wider truncate">{project.title}</h3>
                <p className="text-cyan-400 text-[10px] mt-1">{project.lastModified}</p>
                <div className="mt-2 text-center">
                    <button 
                        onClick={handleClickWrapper}
                        className="bg-cyan-500 text-black text-[10px] font-bold px-3 py-1 rounded-full hover:bg-white transition-colors"
                    >
                        打开 (Open)
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectNode;