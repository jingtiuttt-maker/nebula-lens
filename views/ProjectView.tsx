import React, { useState, useRef } from 'react';
import { Folder, Project } from '../types';
import { Folder as FolderIcon, Plus, ArrowLeft, Trash2, Upload, Check, Pencil, Loader2 } from 'lucide-react';
import { uploadFileToStorage, db, setDoc, doc, deleteDoc } from '../firebase';

interface ProjectViewProps {
  projects: Project[];
  folders: Folder[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  onBack: () => void;
  onCreate: (folderId?: string) => void;
  onOpen: (id: string) => void;
  onDeleteProject?: (id: string) => void; // Added prop
}

const ProjectView: React.FC<ProjectViewProps> = ({ 
    projects, folders, setProjects, setFolders,
    onBack, onCreate, onOpen, onDeleteProject
}) => {
  const [activeFolder, setActiveFolder] = useState<string>(folders[0]?.id || '');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  
  // Project Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Folder Logic
  const handleCreateFolder = () => {
    const newFolder = { id: `f_${Date.now()}`, name: '新建文件夹' };
    setFolders([...folders, newFolder]);
    setActiveFolder(newFolder.id);
    setEditingFolderId(newFolder.id);
    setEditFolderName(newFolder.name);
  };

  const startEditFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
  };

  const saveEditFolder = () => {
    if (editingFolderId) {
        setFolders(folders.map(f => f.id === editingFolderId ? { ...f, name: editFolderName } : f));
        setEditingFolderId(null);
    }
  };

  // Project Logic
  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm('确定要删除这个项目吗？')) {
        try {
            if (onDeleteProject) {
                // If parent provided handler (unlikely in current App.tsx structure but good for decoupling)
                onDeleteProject(id);
            } else {
                 // Default internal handling if not passed
                await deleteDoc(doc(db, "projects", id));
                // Optimistic update
                setProjects(projects.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("删除失败");
        }
    }
  };

  const startEditProject = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      setEditingProjectId(project.id);
      setEditProjectTitle(project.title);
  };

  const saveEditProject = async () => {
      if (editingProjectId) {
          const project = projects.find(p => p.id === editingProjectId);
          if (project) {
              const updated = { ...project, title: editProjectTitle };
              // Optimistic update local
              setProjects(projects.map(p => p.id === editingProjectId ? updated : p));
              // Save to DB
              await setDoc(doc(db, "projects", project.id), updated);
          }
          setEditingProjectId(null);
      }
  };

  const handleUploadClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setTargetProjectId(projectId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetProjectId) {
        setIsUploading(true);
        try {
            const downloadUrl = await uploadFileToStorage(file, `projects/${targetProjectId}/thumbnail_${Date.now()}`);
            
            const project = projects.find(p => p.id === targetProjectId);
            if (project) {
                const updated = { ...project, thumbnail: downloadUrl };
                setProjects(projects.map(p => p.id === targetProjectId ? updated : p));
                await setDoc(doc(db, "projects", targetProjectId), updated);
            }
        } catch (error) {
            alert("上传失败");
        } finally {
            setIsUploading(false);
            setTargetProjectId(null);
        }
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filter projects by folder
  const displayedProjects = projects.filter(p => {
      if (activeFolder === folders[0]?.id && !p.folderId) return true; // Default/First folder catches unassigned
      return p.folderId === activeFolder;
  });

  return (
    <div className="absolute inset-0 flex text-white pt-24 pb-32 px-10 animate-fade-in">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="text-white/70" />
      </button>

      {/* Sidebar - Folders */}
      <div className="w-64 flex flex-col gap-6 border-r border-white/10 pr-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wide">作品库 (Gallery)</h2>
          <button 
            onClick={handleCreateFolder}
            className="p-1.5 rounded-full bg-white/10 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                activeFolder === folder.id 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-l-2 border-cyan-400' 
                  : 'hover:bg-white/5 border-l-2 border-transparent text-gray-400'
              }`}
              onClick={() => setActiveFolder(folder.id)}
              onDoubleClick={() => startEditFolder(folder)}
            >
              <FolderIcon size={18} className={activeFolder === folder.id ? 'text-cyan-400' : ''} />
              
              {editingFolderId === folder.id ? (
                  <div className="flex items-center flex-1 min-w-0 gap-1">
                      <input 
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="bg-black/50 border border-cyan-500/50 rounded text-xs px-1 py-0.5 w-full outline-none text-white"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEditFolder()}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={(e) => {e.stopPropagation(); saveEditFolder()}} className="text-green-400"><Check size={14}/></button>
                  </div>
              ) : (
                  <span className="text-sm font-medium truncate flex-1 select-none">{folder.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Waterfall Grid */}
      <div className="flex-1 pl-8 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProjects.map((project) => (
            <div 
              key={project.id} 
              className="group relative bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              <div className="aspect-[2/3] relative">
                <img 
                  src={project.thumbnail} 
                  alt={project.title} 
                  className="w-full h-full object-cover"
                />
                 {/* Loading Overlay */}
                 {isUploading && targetProjectId === project.id && (
                     <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                         <Loader2 className="animate-spin text-cyan-400" />
                     </div>
                 )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(project.id);
                    }}
                    className="bg-cyan-500 text-black font-bold py-2 px-6 rounded-full transform scale-90 group-hover:scale-100 transition-transform shadow-lg shadow-cyan-500/20"
                  >
                    打开
                  </button>
                  
                  <div className="flex gap-4">
                     <button 
                        onClick={(e) => handleUploadClick(e, project.id)}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                        title="更换封面"
                     >
                        <Upload size={18} />
                     </button>
                     <button 
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="p-2 bg-white/10 rounded-full hover:bg-red-500/20 text-white hover:text-red-400 transition-colors"
                        title="删除项目"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start h-10">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {editingProjectId === project.id ? (
                        <div className="flex items-center gap-1 w-full">
                             <input 
                                value={editProjectTitle}
                                onChange={(e) => setEditProjectTitle(e.target.value)}
                                className="bg-black/50 border border-cyan-500/50 rounded text-sm font-bold text-white w-full px-1 py-0.5 outline-none"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.key === 'Enter' && saveEditProject()}
                                onBlur={saveEditProject}
                             />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <h3 className="font-bold text-sm text-gray-100 mb-1 truncate flex-1" title={project.title}>{project.title}</h3>
                            <button 
                                onClick={(e) => startEditProject(e, project)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-cyan-400 transition-all"
                            >
                                <Pencil size={12} />
                            </button>
                        </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{project.lastModified}</p>
              </div>
            </div>
          ))}
          
          {/* Create New Card (Visual placeholder for grid) */}
          <div 
            onClick={() => onCreate(activeFolder)}
            className="border-2 border-dashed border-white/10 rounded-2xl aspect-[2/3] flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="text-sm font-medium">新建项目</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;