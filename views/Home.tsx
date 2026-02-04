import React, { useEffect, useRef } from 'react';
import ProjectNode from '../components/ProjectNode';
import { Project } from '../types';
import { NodePosition } from '../App';

interface HomeProps {
  projects: Project[];
  onOpen: (id: string) => void;
  nodePositions: Record<string, NodePosition>;
  setNodePositions: React.Dispatch<React.SetStateAction<Record<string, NodePosition>>>;
}

const Home: React.FC<HomeProps> = ({ projects, onOpen, nodePositions, setNodePositions }) => {
  const dragRef = useRef<{ id: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  // Initialize positions ONLY for new projects
  useEffect(() => {
    setNodePositions(prev => {
      const newPositions = { ...prev };
      let changed = false;
      
      projects.forEach((p) => {
        if (!newPositions[p.id]) {
          // Random position for new stars (padding 10% to 90% to stay on screen)
          newPositions[p.id] = {
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20, // avoid top header area
            scale: Math.random() * 0.4 + 0.4 // 0.4 to 0.8
          };
          changed = true;
        }
      });

      return changed ? newPositions : prev;
    });
  }, [projects, setNodePositions]);

  const handleMouseDown = (e: React.MouseEvent, id: string, currentPos: NodePosition) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    const { id, startX, startY, initX, initY } = dragRef.current;
    
    // Convert pixel delta to percentage delta
    const deltaXPercent = ((e.clientX - startX) / window.innerWidth) * 100;
    const deltaYPercent = ((e.clientY - startY) / window.innerHeight) * 100;

    setNodePositions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        x: Math.min(95, Math.max(5, initX + deltaXPercent)),
        y: Math.min(95, Math.max(5, initY + deltaYPercent))
      }
    }));
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden" 
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Title */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0 select-none">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-900 tracking-tighter drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
          NebulaLens<span className="text-cyan-400">.AI</span>
        </h1>
        <h2 className="text-2xl md:text-3xl text-white font-bold mt-4 tracking-widest">
           云镜剧坊
        </h2>
        <p className="text-cyan-200/70 text-base mt-2 tracking-[0.5em] uppercase font-light border-t border-cyan-500/30 pt-4 inline-block">
          捕捉灵感 · 剧现想象
        </p>
      </div>

      {/* Floating Projects */}
      <div className="absolute inset-0 z-10">
        {projects.map((project, index) => {
          const pos = nodePositions[project.id];
          if (!pos) return null; // Wait for initialization

          return (
            <ProjectNode 
              key={project.id} 
              project={project}
              x={pos.x}
              y={pos.y}
              scale={pos.scale}
              delay={index * 0.5}
              onMouseDown={(e) => handleMouseDown(e, project.id, pos)}
              onClick={() => onOpen(project.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Home;