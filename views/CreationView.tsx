import React, { useState } from 'react';
import { CreationStep, Episode, Project, Folder } from '../types';
import { CheckCircle2, Circle, ArrowLeft, Edit3 } from 'lucide-react';
import ScriptStep from './creation/ScriptStep';
import StoryboardStep from './creation/StoryboardStep';
import FinalCutStep from './creation/FinalCutStep';

interface CreationViewProps {
  onBack: () => void;
  initialProjectId: string | null;
  defaultFolderId: string | null;
  existingProjects: Project[];
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  onSaveProject: (project: Project) => void;
}

const CreationView: React.FC<CreationViewProps> = ({ 
    onBack, initialProjectId, defaultFolderId, existingProjects, 
    folders, setFolders, onSaveProject 
}) => {
  const [currentStep, setCurrentStep] = useState<CreationStep>(CreationStep.SCRIPT);
  
  // Initialize project logic:
  const [project, setProject] = useState<Project>(() => {
      if (initialProjectId) {
          const found = existingProjects.find(p => p.id === initialProjectId);
          if (found) return found;
      }
      return {
          id: `new_${Date.now()}`,
          title: '', // Empty title triggers requirement in modal
          thumbnail: 'https://picsum.photos/seed/new/400/600', 
          lastModified: '刚刚',
          episodes: [],
          entities: [] // Initialize empty entities
      };
  });

  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(project.episodes?.[0]?.id || '');
  const activeEpisode = project.episodes?.find(e => e.id === activeEpisodeId);

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    onSaveProject(updatedProject); // Persist changes up
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      const updatedProject = { ...project, title: newTitle };
      setProject(updatedProject);
      // We debounce save slightly or save on blur to avoid too many writes, 
      // but for this demo instant update in state + save on blur is fine
  };

  const handleTitleBlur = () => {
      onSaveProject(project);
  };

  const handleStepClick = (stepId: CreationStep) => {
    if (stepId === CreationStep.STORYBOARD || stepId === CreationStep.FINAL_CUT) {
        if (!activeEpisode || !activeEpisode.hasStoryboard) {
            return;
        }
    }
    setCurrentStep(stepId);
  };

  const renderStep = () => {
    switch (currentStep) {
      case CreationStep.SCRIPT:
        return (
            <ScriptStep 
                project={project}
                defaultFolderId={defaultFolderId} 
                folders={folders}
                setFolders={setFolders}
                onUpdateProject={handleUpdateProject}
                activeEpisodeId={activeEpisodeId}
                setActiveEpisodeId={setActiveEpisodeId}
                onNavigateToStoryboard={() => setCurrentStep(CreationStep.STORYBOARD)}
            />
        );
      case CreationStep.STORYBOARD:
        return (
            <StoryboardStep 
                project={project}
                activeEpisodeId={activeEpisodeId}
                onUpdateProject={handleUpdateProject}
            />
        );
      case CreationStep.FINAL_CUT:
        return <FinalCutStep />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050510]">
      {/* Header / Steps Navigation */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#050510]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity" onClick={onBack}>
               <ArrowLeft className="text-gray-400" size={20} />
            </div>
            
            {/* Editable Title */}
            <div className="relative group">
                <input 
                    value={project.title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    placeholder="未命名项目"
                    className="bg-transparent text-white font-bold tracking-wider text-lg outline-none border border-transparent hover:border-white/10 focus:border-cyan-500/50 rounded px-2 py-1 w-64 transition-all"
                />
                <Edit3 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>

        <div className="flex items-center gap-8">
          {[
            { id: CreationStep.SCRIPT, label: '剧本 (Script)' },
            { id: CreationStep.STORYBOARD, label: '故事板 (Storyboard)' },
            { id: CreationStep.FINAL_CUT, label: '成片 (Final Cut)' },
          ].map((step, index) => {
            const isActive = step.id === currentStep;
            const hasStoryboard = activeEpisode?.hasStoryboard;
            
            // Logic for completion state
            let isCompleted = false;
            if (step.id === CreationStep.SCRIPT && project.episodes && project.episodes.length > 0) isCompleted = true;
            if (step.id === CreationStep.STORYBOARD && hasStoryboard) isCompleted = true;

            const isDisabled = (step.id === CreationStep.STORYBOARD || step.id === CreationStep.FINAL_CUT) && !hasStoryboard;

            return (
              <div 
                key={step.id} 
                onClick={() => !isDisabled && handleStepClick(step.id)}
                className={`flex items-center gap-2 transition-colors ${
                    isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                } ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {isActive ? <Circle size={20} className="fill-cyan-500/20" /> : <CheckCircle2 size={20} className={isCompleted ? "text-cyan-500" : "text-gray-700"} />}
                <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{step.label}</span>
                {index < 2 && <div className="w-8 h-[1px] bg-white/10 ml-6" />}
              </div>
            );
          })}
        </div>

        <div className="w-40 flex justify-end items-center gap-4">
            {activeEpisode && (
                <span className="text-xs text-cyan-500/80 border border-cyan-500/30 px-2 py-1 rounded bg-cyan-900/10">
                    第{activeEpisode.sequence}集
                </span>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black -z-10" />
        {renderStep()}
      </div>
    </div>
  );
};

export default CreationView;