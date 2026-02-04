import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Entity, Project, Shot, ShotHistory } from '../../types';
import { INITIAL_ENTITIES, ANGLES } from '../../constants';
import { Settings, Play, Image as ImageIcon, Video, Mic, RefreshCw, Plus, Trash2, Upload, Volume2, X, GripVertical, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Wand2, Loader2, Save } from 'lucide-react';
import { uploadFileToStorage } from '../../firebase'; // Import helper

interface StoryboardStepProps {
  project: Project;
  activeEpisodeId: string;
  onUpdateProject?: (p: Project) => void;
}

const StoryboardStep: React.FC<StoryboardStepProps> = ({ project, activeEpisodeId, onUpdateProject }) => {
  // Initialize entities: Priority Project-Entities -> Initial Entities
  const [entities, setEntities] = useState<Entity[]>(() => {
      if (project.entities && project.entities.length > 0) return project.entities;
      return INITIAL_ENTITIES;
  });
  
  const currentEpisode = project.episodes?.find(e => e.id === activeEpisodeId);
  const [shots, setShots] = useState<Shot[]>(currentEpisode?.visualShots || []);
  const [uploadShotIndex, setUploadShotIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync back to parent whenever shots or entities change
  const syncChanges = (newShots: Shot[], newEntities: Entity[]) => {
      if (!onUpdateProject || !currentEpisode) return;

      const updatedEpisodes = project.episodes?.map(e => 
          e.id === activeEpisodeId ? { ...e, visualShots: newShots } : e
      );

      onUpdateProject({
          ...project,
          episodes: updatedEpisodes,
          entities: newEntities
      });
  };

  // Initialize shots logic
  useEffect(() => {
     if(currentEpisode) {
         const processedShots = currentEpisode.visualShots.map(shot => {
             if (shot.history.length === 0 && shot.currentVisual) {
                 return {
                     ...shot,
                     history: [{
                         id: `init_h_${shot.id}`,
                         url: shot.currentVisual,
                         type: shot.visualType,
                         timestamp: Date.now()
                     }]
                 };
             }
             return shot;
         });
         setShots(processedShots);
     }
  }, [activeEpisodeId]); // Re-run only when episode changes

  const [activeEntityTab, setActiveEntityTab] = useState<'character' | 'environment'>('character');
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null); // Track if editing existing
  
  // Entity Form State
  const [entityForm, setEntityForm] = useState<{name: string, description: string, voice: string, avatar: string}>({
    name: '', description: '', voice: '默认音色', avatar: ''
  });
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isUploadingEntity, setIsUploadingEntity] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null); // For Shots
  const [showEntityDeleteConfirm, setShowEntityDeleteConfirm] = useState<string | null>(null); // For Entities

  const fileInputRef = useRef<HTMLInputElement>(null);
  const entityFileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getEntityById = (id: string) => entities.find(e => e.id === id);

  const swapShots = (indexA: number, indexB: number) => {
      const newShots = [...shots];
      [newShots[indexA], newShots[indexB]] = [newShots[indexB], newShots[indexA]];
      const sequenced = newShots.map((s, i) => ({...s, sequence: i + 1}));
      setShots(sequenced);
      syncChanges(sequenced, entities);
  };

  // ... (Insert/Update Shot methods same as before) ...
  const insertShotAt = (index: number) => {
    const prevShot = shots[index];
    const newShot: Shot = {
      ...prevShot,
      id: `s_${Date.now()}`,
      sequence: index + 2,
      currentVisual: 'https://picsum.photos/800/450?grayscale', 
      visualType: 'image',
      history: [], 
      dialogue: '...',
      imagePrompt: '新分镜',
      videoPrompt: '',
    };
    newShot.history = [{
        id: `h_${newShot.id}`,
        url: newShot.currentVisual,
        type: newShot.visualType,
        timestamp: Date.now()
    }];

    const newShots = [...shots];
    newShots.splice(index + 1, 0, newShot);
    const sequenced = newShots.map((s, i) => ({...s, sequence: i + 1}));
    setShots(sequenced);
    syncChanges(sequenced, entities);
  };

  const updateShotVisual = (shotIndex: number, visual: string, type: 'image' | 'video') => {
      const newShots = [...shots];
      newShots[shotIndex].currentVisual = visual;
      newShots[shotIndex].visualType = type;
      setShots(newShots);
      syncChanges(newShots, entities);
  };

  const updateShotField = (idx: number, field: keyof Shot, value: any) => {
      const newShots = [...shots];
      newShots[idx] = { ...newShots[idx], [field]: value };
      setShots(newShots);
      syncChanges(newShots, entities);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadShotIndex !== null) {
      const type = file.type.startsWith('video') ? 'video' : 'image';
      
      setIsUploading(true);
      try {
          const downloadUrl = await uploadFileToStorage(file, `projects/${project.id}/shots/${uploadShotIndex}_${Date.now()}`);

          const newShots = [...shots];
          const shot = newShots[uploadShotIndex];
          
          const newHistoryItem: ShotHistory = {
              id: `h_${Date.now()}`,
              url: downloadUrl,
              type: type,
              timestamp: Date.now()
          };
          
          shot.currentVisual = downloadUrl;
          shot.visualType = type;
          shot.history = [newHistoryItem, ...shot.history];
          
          setShots(newShots);
          syncChanges(newShots, entities);
      } catch (e) {
          alert("上传失败");
      } finally {
          setIsUploading(false);
          setUploadShotIndex(null);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Environment Logic (Track 3) ---
  const getEnvironmentSegments = () => {
    const segments: { envId: string, count: number, startIndex: number }[] = [];
    if (shots.length === 0) return segments;

    let currentEnv = shots[0].environmentId;
    let count = 0;
    let startIndex = 0;

    shots.forEach((shot, index) => {
      if (shot.environmentId === currentEnv) {
        count++;
      } else {
        segments.push({ envId: currentEnv, count, startIndex });
        currentEnv = shot.environmentId;
        count = 1;
        startIndex = index;
      }
    });
    segments.push({ envId: currentEnv, count, startIndex });
    return segments;
  };

  const handleEnvResize = (startIndex: number, currentCount: number, direction: 'left' | 'right', action: 'expand' | 'shrink') => {
      const newShots = [...shots];
      const currentEnvId = newShots[startIndex].environmentId;

      if (direction === 'right') {
          if (action === 'expand') {
              const nextIndex = startIndex + currentCount;
              if (nextIndex < newShots.length) {
                  newShots[nextIndex].environmentId = currentEnvId;
              }
          } else {
              const lastIndex = startIndex + currentCount - 1;
              if (lastIndex >= startIndex) { 
                  newShots[lastIndex].environmentId = ''; 
              }
          }
      } else {
          if (action === 'expand') {
              const prevIndex = startIndex - 1;
              if (prevIndex >= 0) {
                  newShots[prevIndex].environmentId = currentEnvId;
              }
          } else {
              if (startIndex < startIndex + currentCount - 1) {
                  newShots[startIndex].environmentId = '';
              }
          }
      }
      setShots(newShots);
      syncChanges(newShots, entities);
  };

  const insertEnvironmentAt = (shotIndex: number) => {
      const newShots = [...shots];
      const newEnv = newShots[shotIndex].environmentId === 'e1' ? 'e2' : 'e1';
      newShots[shotIndex].environmentId = newEnv;
      setShots(newShots);
      syncChanges(newShots, entities);
  };

  // --- Entity Management ---

  const openCreateEntityModal = () => {
      setEditingEntityId(null);
      setEntityForm({
          name: '',
          description: '',
          voice: '默认音色',
          avatar: `https://picsum.photos/100/100?random=${Date.now()}`
      });
      setShowEntityModal(true);
  };

  const openEditEntityModal = (entity: Entity) => {
      setEditingEntityId(entity.id);
      setEntityForm({
          name: entity.name,
          description: entity.description || '',
          voice: entity.voice || '默认音色',
          avatar: entity.avatar
      });
      setShowEntityModal(true);
  };

  const saveEntity = () => {
      let updatedEntities = [...entities];
      
      if (editingEntityId) {
          // Update existing
          updatedEntities = updatedEntities.map(e => e.id === editingEntityId ? {
              ...e,
              name: entityForm.name,
              description: entityForm.description,
              voice: activeEntityTab === 'character' ? entityForm.voice : undefined,
              avatar: entityForm.avatar
          } : e);
      } else {
          // Create new
          const newId = `${activeEntityTab.charAt(0)}${Date.now()}`;
          const newEntity: Entity = {
            id: newId,
            type: activeEntityTab,
            name: entityForm.name,
            description: entityForm.description,
            voice: activeEntityTab === 'character' ? entityForm.voice : undefined,
            avatar: entityForm.avatar
          };
          updatedEntities.push(newEntity);
      }

      setEntities(updatedEntities);
      syncChanges(shots, updatedEntities);
      setShowEntityModal(false);
  };

  const deleteEntity = (id: string) => {
      if (!confirm("确定要删除这个主体吗？这不会影响已经生成的分镜画面。")) return;
      const updatedEntities = entities.filter(e => e.id !== id);
      setEntities(updatedEntities);
      syncChanges(shots, updatedEntities);
  };

  const handleGenerateEntityAvatar = async () => {
      if (!entityForm.description) {
          alert("请输入画面描述提示词");
          return;
      }
      setIsGeneratingAvatar(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `Generate a square avatar image for a ${activeEntityTab}. Style: Anime/Concept Art. Description: ${entityForm.description}`,
        });

        // The model returns an image part
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64 = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                setEntityForm(prev => ({ ...prev, avatar: `data:${mimeType};base64,${base64}` }));
            }
        }
      } catch (e) {
          console.error("Avatar Gen Failed", e);
          alert("生成失败，请重试");
      } finally {
          setIsGeneratingAvatar(false);
      }
  };

  const handleEntityFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingEntity(true);
          try {
              const downloadUrl = await uploadFileToStorage(file, `projects/${project.id}/entities/${Date.now()}`);
              setEntityForm(prev => ({ ...prev, avatar: downloadUrl }));
          } catch(e) {
              alert("上传失败");
          } finally {
              setIsUploadingEntity(false);
          }
      }
  };

  const handleDeleteShot = () => {
     if(!showDeleteModal) return;
     const newShots = shots.filter(s => s.id !== showDeleteModal).map((s, i) => ({...s, sequence: i+1}));
     setShots(newShots);
     syncChanges(newShots, entities);
     setShowDeleteModal(null);
  };

  // Visual constants for alignment
  const CARD_WIDTH = 320;
  const GAP = 24; 

  return (
    <div className="flex h-full gap-6 relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
      <input type="file" ref={entityFileInputRef} className="hidden" accept="image/*" onChange={handleEntityFileUpload} />
      
      {/* Uploading Overlay */}
      {(isUploading || isUploadingEntity) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <div className="bg-gray-900 border border-cyan-500/30 px-6 py-3 rounded-full flex items-center gap-3">
                  <Loader2 className="animate-spin text-cyan-400" />
                  <span className="text-white font-bold">上传媒体中...</span>
              </div>
          </div>
      )}

      {/* LEFT: Entity Panel */}
      <div className="w-72 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col overflow-hidden flex-shrink-0 z-10">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold mb-4">故事主体 (Entities)</h3>
          <div className="flex p-1 bg-black/40 rounded-lg">
            <button onClick={() => setActiveEntityTab('character')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeEntityTab === 'character' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}>人物</button>
            <button onClick={() => setActiveEntityTab('environment')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeEntityTab === 'environment' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}>环境</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {entities.filter(e => e.type === activeEntityTab).map(entity => (
            <div key={entity.id} className="group relative bg-white/5 rounded-xl p-3 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer hover:bg-white/10">
              <div className="flex items-center gap-3">
                <img src={entity.avatar} alt={entity.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{entity.name}</p>
                  {entity.type === 'character' && <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-400/80 bg-cyan-900/20 w-fit px-1.5 py-0.5 rounded"><Volume2 size={10} /> {entity.voice}</div>}
                </div>
                {/* Edit Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEditEntityModal(entity); }} className="text-gray-500 hover:text-cyan-400"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteEntity(entity.id); }} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={openCreateEntityModal} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-500 text-xs hover:text-white flex items-center justify-center gap-2"><Plus size={14} /> 新建{activeEntityTab === 'character' ? '人物' : '环境'}</button>
        </div>
      </div>

      {/* RIGHT: Timeline Tracks */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
        {/* ... (Keep existing Timeline Tracks code, it's robust) ... */}
         {/* Horizontal Scroll Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4 relative">
          <div className="inline-flex flex-col h-full pl-2 pr-32">
            
            {/* TRACK 1: Visuals */}
            <div className="flex items-start mb-6">
              {shots.map((shot, idx) => (
                <div key={`visual-${shot.id}`} className="flex items-center">
                  <div style={{ width: CARD_WIDTH }} className="flex-shrink-0 flex flex-col gap-2">
                    {/* VISUAL CARD */}
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group border border-white/10 hover:border-cyan-500/50 transition-colors shadow-lg">
                      {shot.visualType === 'video' ? (
                          <video src={shot.currentVisual} className="w-full h-full object-contain bg-black" muted /> 
                      ) : (
                          <img src={shot.currentVisual} className="w-full h-full object-contain mx-auto" />
                      )}
                      <div className="absolute top-2 left-2 w-6 h-6 bg-cyan-500 text-black font-bold text-xs rounded-full flex items-center justify-center shadow-lg z-10">{shot.sequence}</div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                           <button className="flex flex-col items-center gap-1 text-white hover:text-cyan-400"><div className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur"><RefreshCw size={18} /></div><span className="text-[10px]">重绘</span></button>
                           <button 
                              onClick={() => {
                                setUploadShotIndex(idx);
                                fileInputRef.current?.click();
                              }}
                              className="flex flex-col items-center gap-1 text-white hover:text-cyan-400"
                           >
                              <div className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur"><Upload size={18} /></div><span className="text-[10px]">上传</span>
                           </button>
                           {shot.visualType === 'video' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white drop-shadow-lg"><Play size={40} fill="rgba(255,255,255,0.8)" /></div>}
                      </div>
                    </div>
                    {/* Thumbnails (History) */}
                    <div className="flex gap-2 h-10 overflow-x-auto hide-scrollbar">
                         {shot.history.map((h, i) => {
                             const item = h as any;
                             const mediaType = (item.visualType || item.type) as 'image' | 'video';
                             const mediaUrl = (item.currentVisual || item.url) as string;
                             const isCurrent = mediaUrl === shot.currentVisual;
                             return (
                                 <div 
                                    key={i} 
                                    onClick={() => updateShotVisual(idx, mediaUrl, mediaType)}
                                    className={`aspect-video bg-white/5 rounded border overflow-hidden relative cursor-pointer hover:border-cyan-400 flex-shrink-0 ${isCurrent ? 'border-cyan-400 ring-1 ring-cyan-400' : 'border-white/10'}`}
                                 >
                                    <img src={mediaUrl} className={`w-full h-full object-cover ${isCurrent ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} />
                                    <div className="absolute bottom-0 right-0 bg-black/50 p-0.5 rounded-tl">{mediaType==='video' ? <Video size={8} /> : <ImageIcon size={8}/>}</div>
                                 </div>
                             );
                         })}
                    </div>
                  </div>

                  {/* Insert Gap */}
                  <div style={{ width: GAP }} className="h-full flex items-center justify-center group/gap relative z-30">
                     <div className="w-[1px] h-32 bg-white/5 group-hover/gap:bg-cyan-500/30 transition-colors"></div>
                     <button onClick={() => insertShotAt(idx)} className="absolute w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-black opacity-0 group-hover/gap:opacity-100 transition-all hover:scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        <Plus size={14} />
                     </button>
                  </div>
                </div>
              ))}
            </div>

            {/* TRACK 2: Parameters */}
            <div className="flex items-start mb-2">
              {shots.map((shot, idx) => {
                 const currentSubject = entities.find(e => e.id === shot.characterId);
                 const currentEnv = entities.find(e => e.id === shot.environmentId);
                 
                 return (
                <div key={`params-${shot.id}`} className="flex items-center">
                  <div style={{ width: CARD_WIDTH }} className="flex-shrink-0 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex flex-col gap-3 relative group hover:border-cyan-500/30 transition-all">
                    
                    {/* Drag Handle Top */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/10 rounded-full px-2 py-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                        {idx > 0 && <button onClick={() => swapShots(idx, idx-1)} className="hover:text-cyan-400">←</button>}
                        <GripVertical size={12} className="text-gray-500" />
                        {idx < shots.length - 1 && <button onClick={() => swapShots(idx, idx+1)} className="hover:text-cyan-400">→</button>}
                    </div>

                    {/* Row 1: Character & Environment */}
                    <div className="flex gap-2">
                        {/* Character Dropdown */}
                        <div className="flex-1 relative bg-black/40 rounded border border-white/5 hover:border-cyan-500/30 transition-colors group/subject">
                            <div className="flex items-center gap-2 p-1.5 cursor-pointer">
                                {currentSubject ? (
                                    <>
                                      <img src={currentSubject.avatar} className="w-5 h-5 rounded-full object-cover" />
                                      <span className="text-xs text-white truncate flex-1">{currentSubject.name}</span>
                                    </>
                                ) : <span className="text-xs text-cyan-400">+ 人物</span>}
                            </div>
                            {/* Fake Dropdown (Demo) */}
                            <div className="absolute top-full left-0 w-full bg-gray-900 border border-white/10 rounded-lg mt-1 z-50 hidden group-hover/subject:block shadow-xl max-h-40 overflow-y-auto">
                                {entities.filter(e => e.type === 'character').map(e => (
                                    <div key={e.id} className="flex items-center gap-2 p-2 hover:bg-white/10 cursor-pointer" onClick={() => {
                                        updateShotField(idx, 'characterId', e.id);
                                    }}>
                                        <img src={e.avatar} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs text-gray-300">{e.name}</span>
                                    </div>
                                ))}
                                <div className="p-2 text-xs text-cyan-400 border-t border-white/10 cursor-pointer hover:bg-white/5" onClick={openCreateEntityModal}>+ 新建人物</div>
                            </div>
                        </div>

                        {/* Environment Dropdown */}
                        <div className="flex-1 relative bg-black/40 rounded border border-white/5 hover:border-cyan-500/30 transition-colors group/env">
                            <div className="flex items-center gap-2 p-1.5 cursor-pointer">
                                {currentEnv ? (
                                    <>
                                      <img src={currentEnv.avatar} className="w-5 h-5 rounded-full object-cover" />
                                      <span className="text-xs text-white truncate flex-1">{currentEnv.name}</span>
                                    </>
                                ) : <span className="text-xs text-gray-500 truncate">+ 环境</span>}
                            </div>
                            <div className="absolute top-full left-0 w-full bg-gray-900 border border-white/10 rounded-lg mt-1 z-50 hidden group-hover/env:block shadow-xl max-h-40 overflow-y-auto">
                                {entities.filter(e => e.type === 'environment').map(e => (
                                    <div key={e.id} className="flex items-center gap-2 p-2 hover:bg-white/10 cursor-pointer" onClick={() => {
                                        updateShotField(idx, 'environmentId', e.id);
                                    }}>
                                        <img src={e.avatar} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs text-gray-300">{e.name}</span>
                                    </div>
                                ))}
                                <div className="p-2 text-xs text-cyan-400 border-t border-white/10 cursor-pointer hover:bg-white/5" onClick={() => {
                                    setActiveEntityTab('environment');
                                    openCreateEntityModal();
                                }}>+ 新建环境</div>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Angle */}
                    <div className="bg-black/30 rounded p-1.5 border border-white/5 flex items-center gap-2">
                         <span className="text-[10px] text-gray-500 uppercase flex-shrink-0">镜头</span>
                         <select 
                            className="bg-transparent text-xs text-purple-400 w-full outline-none" 
                            value={shot.angle}
                            onChange={(e) => {
                                updateShotField(idx, 'angle', e.target.value);
                            }}
                         >
                            {ANGLES.map(a => <option key={a} value={a.split(' ')[0]}>{a.split(' ')[0]}</option>)}
                         </select>
                    </div>

                    {/* Dialogue */}
                    <div className="bg-black/30 rounded p-2 border border-white/5">
                       <label className="text-[9px] text-gray-500 uppercase flex items-center gap-1 mb-1"><Mic size={8} /> 台词</label>
                       <textarea 
                            className="w-full bg-transparent text-xs text-white italic outline-none resize-none" 
                            rows={1} 
                            value={shot.dialogue} 
                            onChange={(e) => updateShotField(idx, 'dialogue', e.target.value)}
                        />
                    </div>

                    {/* Prompts */}
                    <div className="space-y-2">
                         <div>
                            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                                <span>画面提示词</span>
                                <button className="text-[9px] font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 rounded-full hover:brightness-110 shadow-[0_0_10px_rgba(251,191,36,0.4)]">生图</button>
                            </div>
                            <textarea 
                                className="w-full bg-black/20 text-[10px] text-gray-400 rounded p-1.5 border border-white/5 focus:border-cyan-500/40 outline-none resize-none leading-relaxed" 
                                rows={3} 
                                value={shot.imagePrompt}
                                onChange={(e) => updateShotField(idx, 'imagePrompt', e.target.value)}
                            />
                         </div>
                         <div>
                            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                                <span>视频提示词</span>
                                <button className="text-[9px] font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 px-2 py-0.5 rounded-full hover:brightness-110 shadow-[0_0_10px_rgba(52,211,153,0.4)]">生视频</button>
                            </div>
                            <textarea 
                                className="w-full bg-black/20 text-[10px] text-gray-400 rounded p-1.5 border border-white/5 focus:border-purple-500/40 outline-none resize-none leading-relaxed" 
                                rows={3} 
                                value={shot.videoPrompt}
                                onChange={(e) => updateShotField(idx, 'videoPrompt', e.target.value)}
                            />
                         </div>
                    </div>

                    {/* Delete */}
                    <button onClick={() => setShowDeleteModal(shot.id)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                  
                  {/* Spacer to match Visual Track */}
                  <div style={{ width: GAP }} className="flex-shrink-0" />
                </div>
              );})}
            </div>

            {/* TRACK 3: Environment Slider (Fixed at bottom of scroll area) */}
            <div className="h-20 w-full flex items-start pt-2 relative mt-4">
               {/* Grid Lines for Alignment */}
               <div className="absolute inset-0 flex pointer-events-none">
                    {shots.map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex">
                            <div style={{width: CARD_WIDTH}} className="border-r border-dashed border-white/5 h-full" />
                            <div style={{width: GAP}} className="flex items-center justify-center">
                                {/* Insert Env Point */}
                                <div className="w-[1px] h-full bg-white/5"></div>
                            </div>
                        </div>
                    ))}
               </div>

               {/* Environment Segments */}
               <div className="flex items-center relative h-full">
                  {getEnvironmentSegments().map((seg, i) => {
                     const env = getEntityById(seg.envId);
                     // Calculate exact pixel width: (Count * Card) + ((Count - 1) * Gap)
                     const width = (seg.count * CARD_WIDTH) + ((seg.count - 1) * GAP);
                     
                     return (
                         <div key={i} className="flex-shrink-0 flex items-start h-12 relative" style={{ marginRight: GAP }}>
                           <div 
                              style={{ width: `${width}px` }}
                              className="h-full bg-gray-800/90 rounded-xl border border-white/10 flex items-center px-1 relative group hover:border-cyan-500/50 transition-colors shadow-lg overflow-hidden select-none"
                           >
                              {/* Left Resize Handle */}
                              <div className="absolute left-0 top-0 bottom-0 flex z-20">
                                <button 
                                    onClick={() => handleEnvResize(seg.startIndex, seg.count, 'left', 'expand')}
                                    className="w-4 h-full flex items-center justify-center hover:bg-white/20 text-gray-500 hover:text-white"
                                >
                                    <ChevronLeft size={10} />
                                </button>
                                <button 
                                    onClick={() => handleEnvResize(seg.startIndex, seg.count, 'left', 'shrink')}
                                    className="w-4 h-full flex items-center justify-center hover:bg-white/20 text-gray-500 hover:text-white border-l border-white/5"
                                >
                                    <ChevronRight size={10} />
                                </button>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 flex items-center justify-center gap-2 z-0 mx-10">
                                  {env ? (
                                    <>
                                        <img src={env.avatar} className="w-6 h-6 rounded-full ring-1 ring-white/20" />
                                        <span className="text-xs text-white font-bold shadow-black drop-shadow-md">{env.name}</span>
                                    </>
                                  ) : <span className="text-xs text-gray-500">无环境</span>}
                              </div>

                              {/* Right Resize Handle */}
                              <div className="absolute right-0 top-0 bottom-0 flex z-20">
                                <button 
                                    onClick={() => handleEnvResize(seg.startIndex, seg.count, 'right', 'shrink')}
                                    className="w-4 h-full flex items-center justify-center hover:bg-white/20 text-gray-500 hover:text-white border-r border-white/5"
                                >
                                    <ChevronLeft size={10} />
                                </button>
                                <button 
                                    onClick={() => handleEnvResize(seg.startIndex, seg.count, 'right', 'expand')}
                                    className="w-4 h-full flex items-center justify-center hover:bg-white/20 text-gray-500 hover:text-white"
                                >
                                    <ChevronRight size={10} />
                                </button>
                              </div>
                           </div>
                           
                           {/* Insert New Env Button (In Gap after this segment) */}
                           <button 
                                onClick={() => insertEnvironmentAt(seg.startIndex + seg.count)}
                                className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-700 hover:bg-cyan-500 hover:text-black flex items-center justify-center text-[8px] z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{right: -GAP/2 - 8}}
                            >
                                <Plus size={8} />
                           </button>

                         </div>
                     );
                  })}
               </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Modals (Entity & Delete) */}
      {showEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-96 shadow-2xl relative">
                 <button onClick={() => setShowEntityModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button>
                 
                 <h3 className="text-white font-bold mb-4">{editingEntityId ? '编辑' : '新建'}{activeEntityTab === 'character' ? '人物' : '环境'}</h3>
                 
                 <div className="flex gap-4 mb-4">
                     <div className="relative w-24 h-24 bg-black/40 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group">
                         {entityForm.avatar ? (
                             <img src={entityForm.avatar} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={24} /></div>
                         )}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button onClick={() => entityFileInputRef.current?.click()} className="p-1.5 bg-white/20 rounded hover:bg-white/40 text-white" title="上传"><Upload size={14} /></button>
                         </div>
                     </div>
                     <div className="flex-1 space-y-2">
                         <input 
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm" 
                            placeholder="名称" 
                            value={entityForm.name}
                            onChange={e => setEntityForm({...entityForm, name: e.target.value})} 
                         />
                         {activeEntityTab === 'character' && (
                             <input 
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm" 
                                placeholder="音色描述 (如: 少年音)" 
                                value={entityForm.voice}
                                onChange={e => setEntityForm({...entityForm, voice: e.target.value})} 
                             />
                         )}
                     </div>
                 </div>

                 <div className="mb-4">
                     <label className="text-xs text-gray-500 mb-1 block">画面提示词 (用于生成主体形象)</label>
                     <div className="relative">
                        <textarea 
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm h-24 resize-none" 
                            placeholder="详细描述外貌特征..." 
                            value={entityForm.description}
                            onChange={e => setEntityForm({...entityForm, description: e.target.value})} 
                        />
                        <button 
                            onClick={handleGenerateEntityAvatar}
                            disabled={isGeneratingAvatar}
                            className="absolute bottom-2 right-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded flex items-center gap-1 hover:bg-cyan-500/30 disabled:opacity-50"
                        >
                            {isGeneratingAvatar ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                            {isGeneratingAvatar ? '生成中' : 'AI生成'}
                        </button>
                     </div>
                 </div>

                 <div className="flex gap-2">
                     <button onClick={() => setShowEntityModal(false)} className="flex-1 py-2 bg-gray-700 text-white rounded">取消</button>
                     <button onClick={saveEntity} className="flex-1 py-2 bg-cyan-500 text-black font-bold rounded flex items-center justify-center gap-2">
                        <Save size={14} /> 保存
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardStep;