import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Project, Episode, TextShot, Folder, Entity, Shot } from '../../types';
import { Sparkles, LayoutList, GripVertical, Plus, Wand2, Calendar, MapPin, Video, ChevronUp, ChevronDown, Folder as FolderIcon, Loader2, MessageSquare, Palette, X } from 'lucide-react';

interface ScriptStepProps {
  project: Project;
  defaultFolderId: string | null;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  onUpdateProject: (p: Project) => void;
  activeEpisodeId: string;
  setActiveEpisodeId: (id: string) => void;
  onNavigateToStoryboard: () => void;
}

// Styles for Storyboard Generation
const ANIME_STYLES = [
    { id: 'ghibli', name: '宫崎骏风格 (Ghibli)', prompt: 'Studio Ghibli style, hand-painted background, vibrant colors, detailed clouds' },
    { id: 'shinkai', name: '新海诚风格 (Shinkai)', prompt: 'Makoto Shinkai style, hyper-realistic lighting, lens flares, high contrast, vibrant sky' },
    { id: 'cyberpunk', name: '赛博朋克 (Cyberpunk)', prompt: 'Cyberpunk anime style, neon lights, futuristic city, rain, dark atmosphere' },
    { id: 'comic', name: '美漫风格 (Comic)', prompt: 'American comic book style, bold outlines, cel-shaded, dynamic action' },
    { id: 'ink', name: '水墨国风 (Ink Wash)', prompt: 'Chinese ink wash painting style, watercolor, ethereal, ancient atmosphere' },
    { id: 'pixar', name: '皮克斯风格 (Pixar)', prompt: 'Pixar 3D animation style, soft lighting, cute characters, high detail 3D render' },
    { id: 'lovecraft', name: '克苏鲁暗黑 (Dark)', prompt: 'Lovecraftian horror anime style, dark, mysterious, shadows, tentacles, eerie' },
    { id: 'vaporwave', name: '蒸汽波 (Vaporwave)', prompt: 'Vaporwave aesthetic, retro 80s anime, pink and purple palette, glitch effects' },
    { id: 'clay', name: '粘土定格 (Clay)', prompt: 'Claymation style, stop motion texture, soft edges, handmade feel' },
    { id: 'flat', name: '极简扁平 (Flat)', prompt: 'Flat vector art style, minimalism, solid colors, clean lines' },
];

// Helper to reorder array
const reorder = <T,>(list: T[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const ScriptStep: React.FC<ScriptStepProps> = ({ 
    project, defaultFolderId, folders, setFolders,
    onUpdateProject, 
    activeEpisodeId, 
    setActiveEpisodeId,
    onNavigateToStoryboard
}) => {
  // State for Entry Dialog
  const isNewProject = !project.episodes || project.episodes.length === 0;
  const [showSetupModal, setShowSetupModal] = useState(isNewProject);
  
  // Empty Script Confirmation State
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  // Setup Form State
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId || folders[0]?.id || '');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [concept, setConcept] = useState('');
  const [scriptInput, setScriptInput] = useState('');
  const [episodeCount, setEpisodeCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingSplit, setIsProcessingSplit] = useState(false); 
  const [isGeneratingShots, setIsGeneratingShots] = useState(false); 
  
  // Storyboard Generation State
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(ANIME_STYLES[0]);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);

  // Editor State
  const activeEpisode = project.episodes?.find(e => e.id === activeEpisodeId);
  const [shotCountTarget, setShotCountTarget] = useState(10);

  // --- Handlers for Setup ---
  
  const handleCreateNewFolder = () => {
      if(!newFolderName.trim()) return;
      const newFolder = { id: `f_${Date.now()}`, name: newFolderName };
      setFolders([...folders, newFolder]);
      setSelectedFolderId(newFolder.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
  };

  const handleAIExpand = async () => {
    if (!concept.trim()) {
        alert("请先输入创意灵感");
        return;
    }

    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `请根据以下创意/灵感，扩写成一个约2000字的短剧剧本。
            
要求：
1. 包含完整的剧本格式（场景头、动作描述、人物对话）。
2. 分为若干集（推荐${episodeCount}集），每集有小标题。
3. 剧情紧凑，冲突激烈，反转多。
4. 语言生动，具有画面感。

创意/灵感：
${concept}`,
        });

        const text = response.text;
        if (text) {
            setScriptInput(text);
        }
    } catch (error) {
        console.error("AI Generation failed:", error);
        alert("AI扩写失败，请检查您的网络连接或 API Key 配置。");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSmartSplitClick = async () => {
      // Logic 1: Handle Empty Script using Custom Modal
      if (!scriptInput.trim()) {
          setShowEmptyConfirm(true);
          return;
      }
      
      // Logic 2: Handle Normal Split
      await processSmartSplit();
  };

  const createEmptyEpisodes = () => {
      const newEpisodes: Episode[] = Array.from({ length: episodeCount }).map((_, index) => ({
          id: `ep_${Date.now()}_${index}`,
          sequence: index + 1,
          title: `未命名`,
          scriptContent: '',
          textShots: [],
          visualShots: [],
          hasStoryboard: false
      }));

      const finalTitle = projectTitle.trim() || concept.slice(0, 10) || '未命名项目';
      const updatedProject: Project = {
          ...project,
          title: finalTitle,
          folderId: selectedFolderId,
          episodes: newEpisodes
      };
      
      onUpdateProject(updatedProject);
      setActiveEpisodeId(newEpisodes[0]?.id);
      setShowSetupModal(false);
      setShowEmptyConfirm(false);
  };

  const processSmartSplit = async () => {
    setIsProcessingSplit(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `你是一位专业的短剧编剧。请将用户提供的剧本/大纲整理并拆分为 ${episodeCount} 集。
            
            原文内容：
            ${scriptInput}

            要求：
            1. 严格按照JSON格式返回，不要包含Markdown标记。
            2. 每集内容需要包含具体的场景描写和对话。
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { 
                                type: Type.STRING,
                                description: "本集的小标题（纯标题，不要包含'第X集'前缀）"
                            },
                            content: { 
                                type: Type.STRING,
                                description: "本集的完整剧本内容。"
                            }
                        },
                        required: ["title", "content"]
                    }
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("AI 未返回有效内容");
        
        const splitData = JSON.parse(jsonText);
        const newEpisodes: Episode[] = splitData.map((item: any, index: number) => ({
            id: `ep_${Date.now()}_${index}`,
            sequence: index + 1,
            title: item.title || `新章节`,
            scriptContent: item.content || '',
            textShots: [],
            visualShots: [],
            hasStoryboard: false
        }));

        const finalTitle = projectTitle.trim() || concept.slice(0, 10) || '未命名项目';
        const updatedProject: Project = {
            ...project,
            title: finalTitle,
            folderId: selectedFolderId,
            episodes: newEpisodes
        };

        onUpdateProject(updatedProject);
        setActiveEpisodeId(newEpisodes[0]?.id);
        setShowSetupModal(false);

    } catch (error) {
        console.error("AI Split failed:", error);
        alert("智能分集失败，请重试。");
    } finally {
        setIsProcessingSplit(false);
    }
  };

  // --- Handlers for Script & Shots ---

  const handleScriptChange = (text: string) => {
      if (!project.episodes || !activeEpisode) return;
      const updatedEps = project.episodes.map(e => e.id === activeEpisode.id ? { ...e, scriptContent: text } : e);
      onUpdateProject({ ...project, episodes: updatedEps });
  };

  const addEpisode = () => {
      const newEp: Episode = {
          id: `ep_${Date.now()}`,
          sequence: (project.episodes?.length || 0) + 1,
          title: '新章节',
          scriptContent: '',
          textShots: [],
          visualShots: [],
          hasStoryboard: false
      };
      const updatedEps = [...(project.episodes || []), newEp];
      onUpdateProject({ ...project, episodes: updatedEps });
      setActiveEpisodeId(newEp.id);
  };

  const updateEpisodeTitle = (id: string, newTitle: string) => {
      if (!project.episodes) return;
      const updatedEps = project.episodes.map(e => e.id === id ? { ...e, title: newTitle } : e);
      onUpdateProject({ ...project, episodes: updatedEps });
  };

  const moveEpisode = (fromIndex: number, toIndex: number) => {
      if (!project.episodes) return;
      const newEps = reorder(project.episodes, fromIndex, toIndex).map((e, i) => ({ ...e, sequence: i + 1 }));
      onUpdateProject({ ...project, episodes: newEps });
  };

  const updateShotField = (shotId: string, field: keyof TextShot, value: string) => {
      if (!activeEpisode) return;
      const updatedShots = activeEpisode.textShots.map(s => 
          s.id === shotId ? { ...s, [field]: value } : s
      );
      const updatedEps = project.episodes?.map(e => 
          e.id === activeEpisodeId ? { ...e, textShots: updatedShots } : e
      ) || [];
      onUpdateProject({ ...project, episodes: updatedEps });
  };

  const moveShot = (fromIndex: number, toIndex: number) => {
      if (!activeEpisode) return;
      const newShots = reorder(activeEpisode.textShots, fromIndex, toIndex);
      const updatedEps = project.episodes?.map(e => 
          e.id === activeEpisodeId ? { ...e, textShots: newShots } : e
      ) || [];
      onUpdateProject({ ...project, episodes: updatedEps });
  };

  const handleSmartShots = async () => {
      if (!project.episodes || !activeEpisode) return;
      if (!activeEpisode.scriptContent || activeEpisode.scriptContent.length < 10) {
          alert("剧本内容过少，无法生成分镜。请先编写剧本。");
          return;
      }

      setIsGeneratingShots(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: `你是一位顶尖的动画导演。请深度分析以下剧本片段，将其拆解为 ${shotCountTarget} 个精彩镜头。
              
              剧本内容：
              ${activeEpisode.scriptContent}

              要求：
              1. 提取对白（Who said What），格式为“人物：台词”。
              2. 镜头语言丰富（大远景、特写、过肩、荷兰角等）。
              3. 严格 JSON 格式。
              `,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              time: { type: Type.STRING, description: "时间与光影氛围" },
                              location: { type: Type.STRING, description: "具体地点" },
                              action: { type: Type.STRING, description: "画面内容与动作" },
                              angle: { type: Type.STRING, description: "镜头术语" },
                              dialogue: { type: Type.STRING, description: "该镜头的对白（人物名：内容），如无则为空字符串" }
                          },
                          required: ["time", "location", "action", "angle"]
                      }
                  }
              }
          });

          const jsonText = response.text;
          if (!jsonText) throw new Error("AI 未返回有效分镜数据");
          const shotData = JSON.parse(jsonText);

          const newShots: TextShot[] = shotData.map((item: any, index: number) => ({
              id: `ts_${Date.now()}_${index}`,
              time: item.time,
              location: item.location,
              action: item.action,
              angle: item.angle,
              dialogue: item.dialogue || ''
          }));

          const updatedEps = project.episodes.map(e => e.id === activeEpisode.id ? { ...e, textShots: newShots } : e);
          onUpdateProject({ ...project, episodes: updatedEps });

      } catch (error) {
          console.error("Smart Shots Generation Failed:", error);
          alert("智能分镜生成失败，请重试。");
      } finally {
          setIsGeneratingShots(false);
      }
  };

  // --- Storyboard Generation Logic ---

  const handleCreateStoryboardClick = () => {
      if (!activeEpisode?.textShots.length) {
          alert("请先生成或添加分镜文本。");
          return;
      }
      setShowStyleModal(true);
  };

  const generateStoryboardWithAI = async () => {
      if (!activeEpisode) return;
      setIsGeneratingStoryboard(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          // Provide context about existing entities to avoid duplicates
          const existingEntitiesContext = project.entities?.map(e => `Name: ${e.name}, ID: ${e.id}, Type: ${e.type}`).join('\n') || "None";
          
          const prompt = `
          你是一位专业的故事板艺术家和美术指导。
          风格：${selectedStyle.name} (${selectedStyle.prompt})。
          
          任务：
          1. 分析下方的剧本和文字分镜。
          2. 识别核心人物和环境。
             - 关键：检查下方的“现有实体 (Existing Entities)”。
             - 如果实体已存在（名字相似），必须使用其 ID。不要重复创建。
             - 仅在绝对是新角色或新地点时创建新实体。
          3. 将文字分镜转换为视觉分镜参数。
          4. 对于 'imagePrompt' (画面提示词) 和 'videoPrompt' (视频提示词)，请编写极具画面感、细节丰富的中文提示词，并包含风格关键词： "${selectedStyle.prompt}"。
          5. 所有输出的描述性文字（名称、描述、对话、提示词）必须使用中文。
          
          现有实体 (Existing Entities):
          ${existingEntitiesContext}

          文字分镜 (Text Shots):
          ${JSON.stringify(activeEpisode.textShots)}

          请返回 JSON 格式：
          - newEntities: 新创建的实体数组。
          - visualShots: 对应的视觉分镜数组。
          `;

          const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt,
             config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.OBJECT,
                     properties: {
                         newEntities: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     type: { type: Type.STRING, enum: ['character', 'environment'] },
                                     name: { type: Type.STRING, description: "实体的中文名称" },
                                     description: { type: Type.STRING, description: "实体的中文外貌描述" }
                                 },
                                 required: ['type', 'name', 'description']
                             }
                         },
                         visualShots: {
                             type: Type.ARRAY,
                             items: {
                                 type: Type.OBJECT,
                                 properties: {
                                     characterId: { type: Type.STRING, description: "ID of the character (reused or new)" },
                                     environmentId: { type: Type.STRING, description: "ID of the environment (reused or new)" },
                                     angle: { type: Type.STRING },
                                     dialogue: { type: Type.STRING, description: "中文对白" },
                                     imagePrompt: { type: Type.STRING, description: "详细的中文画面生成提示词" },
                                     videoPrompt: { type: Type.STRING, description: "详细的中文视频生成提示词" }
                                 },
                                 required: ['angle', 'imagePrompt', 'videoPrompt']
                             }
                         }
                     }
                 }
             }
          });

          const result = JSON.parse(response.text || "{}");
          
          // 1. Process New Entities
          const createdEntities: Entity[] = (result.newEntities || []).map((e: any) => ({
              id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: e.type,
              name: e.name,
              description: e.description,
              avatar: `https://picsum.photos/seed/${e.name}/100/100`, // Placeholder, user will gen later
              voice: '默认音色'
          }));

          // Merge with project entities
          const allEntities = [...(project.entities || []), ...createdEntities];

          // 2. Map Visual Shots
          const visualShots: Shot[] = result.visualShots.map((vs: any, index: number) => {
             let charId = vs.characterId;
             let envId = vs.environmentId;
             
             // ID Resolution: Try to match names if ID is not found in existing
             // AI might return "New Character Name" as ID if it messed up.
             
             // Check against newly created
             const foundNewChar = createdEntities.find(e => e.name === charId);
             if (foundNewChar) charId = foundNewChar.id;

             const foundNewEnv = createdEntities.find(e => e.name === envId);
             if (foundNewEnv) envId = foundNewEnv.id;

             // Check against existing (AI should have returned ID, but if it returned name...)
             const foundExisting = project.entities?.find(e => e.name === charId || e.id === charId);
             if (foundExisting) charId = foundExisting.id;

             const foundExistingEnv = project.entities?.find(e => e.name === envId || e.id === envId);
             if (foundExistingEnv) envId = foundExistingEnv.id;

             return {
                 id: `s_${Date.now()}_${index}`,
                 sequence: index + 1,
                 currentVisual: `https://picsum.photos/seed/${index}/800/450?grayscale`, // Placeholder
                 visualType: 'image',
                 history: [],
                 characterId: charId || '',
                 environmentId: envId || '',
                 angle: vs.angle,
                 dialogue: vs.dialogue || activeEpisode.textShots[index]?.dialogue || '',
                 imagePrompt: vs.imagePrompt,
                 videoPrompt: vs.videoPrompt
             };
          });

          // Update Project
          const updatedEpisodes = project.episodes!.map(e => 
              e.id === activeEpisodeId ? { ...e, visualShots, hasStoryboard: true } : e
          );

          onUpdateProject({
              ...project,
              entities: allEntities,
              episodes: updatedEpisodes
          });

          setShowStyleModal(false);
          onNavigateToStoryboard();

      } catch (e) {
          console.error("Storyboard Gen Error", e);
          alert("故事板生成失败，请重试");
      } finally {
          setIsGeneratingStoryboard(false);
      }
  };


  // --- Render ---

  // ... (Setup Modal - Same as before but with updated logic) ...
  if (showSetupModal) {
      return (
          <div className="h-full flex items-center justify-center p-8 relative">
              {/* Empty Script Confirmation Modal */}
              {showEmptyConfirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-2">暂无剧本内容</h3>
                        <p className="text-gray-400 text-sm mb-6">您确定要跳过剧本输入直接分集吗？系统将为您创建 {episodeCount} 个空白集。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowEmptyConfirm(false)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700">取消</button>
                            <button onClick={createEmptyEpisodes} className="flex-1 py-2 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400">继续分集</button>
                        </div>
                    </div>
                </div>
              )}

              <div className="max-w-4xl w-full bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl animate-scale-up flex flex-col h-[85vh]">
                  <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex-shrink-0">
                      创建新作品
                  </h2>
                  {/* ... (Existing Input Fields) ... */}
                  <div className="flex gap-4 mb-6 flex-shrink-0">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">作品名称</label>
                          <input 
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50"
                            placeholder="请输入作品名称..."
                          />
                      </div>
                      <div className="w-1/3">
                          <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">文件夹</label>
                          {isCreatingFolder ? (
                              <div className="flex gap-2">
                                  <input 
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50"
                                    placeholder="文件夹名称"
                                  />
                                  <button onClick={handleCreateNewFolder} className="bg-cyan-500/20 text-cyan-400 px-3 rounded-lg text-xs">确定</button>
                                  <button onClick={() => setIsCreatingFolder(false)} className="bg-white/10 text-gray-400 px-3 rounded-lg text-xs">取消</button>
                              </div>
                          ) : (
                             <div className="relative">
                                 <select 
                                    value={selectedFolderId}
                                    onChange={(e) => {
                                        if (e.target.value === 'NEW') setIsCreatingFolder(true);
                                        else setSelectedFolderId(e.target.value);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-cyan-500/50 appearance-none"
                                 >
                                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    <option value="NEW">+ 新建文件夹...</option>
                                 </select>
                                 <FolderIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                             </div>
                          )}
                      </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                      {/* Concept Input (Small) */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                          <label className="text-sm text-cyan-400 font-bold uppercase">创意 / 灵感 (Concept)</label>
                          <div className="relative">
                            <textarea 
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                className="w-full h-20 bg-black/40 rounded-xl p-4 border border-white/10 text-sm text-gray-300 resize-none outline-none placeholder-gray-600 focus:border-cyan-500/50 transition-colors pr-32"
                                placeholder="输入一句话灵感..."
                            />
                            <button 
                                onClick={handleAIExpand}
                                disabled={isGenerating}
                                className="absolute bottom-3 right-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-xs px-3 py-1.5 flex items-center gap-2 transition-colors border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {isGenerating ? '扩写中...' : 'AI 扩写'}
                            </button>
                          </div>
                      </div>

                      {/* Script Input (Large) */}
                      <div className="flex flex-col gap-2 flex-1 min-h-0">
                          <label className="text-sm text-gray-400 font-bold uppercase">剧本正文 (Script)</label>
                          <textarea 
                             value={scriptInput}
                             onChange={(e) => setScriptInput(e.target.value)}
                             className="w-full h-full bg-black/40 rounded-xl p-4 border border-white/10 text-sm text-gray-300 resize-none outline-none placeholder-gray-600 focus:border-cyan-500/50 transition-colors custom-scrollbar"
                             placeholder="在此直接粘贴或编辑剧本，或使用上方 AI 扩写生成..."
                          />
                      </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-6 mt-6 flex-shrink-0">
                      
                      <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/10">
                          <button onClick={() => setEpisodeCount(Math.max(1, episodeCount - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-gray-300">-</button>
                          <span className="text-xs text-gray-500 font-bold uppercase mx-1">预计集数</span>
                          <input type="number" value={episodeCount} onChange={(e) => setEpisodeCount(parseInt(e.target.value) || 1)} className="w-12 bg-transparent text-center text-cyan-400 font-bold outline-none" />
                          <button onClick={() => setEpisodeCount(episodeCount + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-gray-300">+</button>
                      </div>

                      <button 
                        onClick={handleSmartSplitClick} // Changed Handler
                        disabled={isProcessingSplit}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                      >
                         {isProcessingSplit ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                         {isProcessingSplit ? '智能拆分中...' : '智能分集'} 
                         {/* Button Text Updated */}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex gap-4 p-6 overflow-hidden relative">
        {/* COLUMN 1: Episode List (Narrow) */}
        <div className="w-64 bg-gray-900/60 backdrop-blur border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            {/* ... (Keep existing Column 1 content) ... */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2"><LayoutList size={18} /> 分集列表</h3>
                <button onClick={addEpisode} className="p-1 hover:bg-white/10 rounded text-cyan-400"><Plus size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {project.episodes?.map((ep, index) => (
                    <div 
                        key={ep.id}
                        onClick={() => setActiveEpisodeId(ep.id)}
                        className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer border border-transparent transition-all ${
                            activeEpisodeId === ep.id 
                            ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400' 
                            : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <div className="opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab text-gray-500" title="按住拖动(Demo)">
                           <GripVertical size={14} /> 
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-white/10 px-1 rounded text-gray-400 whitespace-nowrap">第{ep.sequence}集</span>
                                <input 
                                    value={ep.title} 
                                    onChange={(e) => updateEpisodeTitle(ep.id, e.target.value)}
                                    className="bg-transparent font-bold text-sm w-full outline-none focus:border-b focus:border-cyan-500/50"
                                />
                            </div>
                            <div className="text-[10px] opacity-60 flex gap-2">
                                <span>{ep.textShots.length} 镜</span>
                                {ep.hasStoryboard && <span className="text-green-400">已生成</span>}
                            </div>
                        </div>
                        
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 gap-1">
                             {index > 0 && <button onClick={(e) => {e.stopPropagation(); moveEpisode(index, index-1)}} className="text-[10px] p-0.5 rounded hover:bg-white/20"><ChevronUp size={10} /></button>}
                             {index < (project.episodes?.length || 0) - 1 && <button onClick={(e) => {e.stopPropagation(); moveEpisode(index, index+1)}} className="text-[10px] p-0.5 rounded hover:bg-white/20"><ChevronDown size={10} /></button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMN 2: Script Editor (Medium) */}
        <div className="flex-1 bg-gray-900/60 backdrop-blur border border-white/10 rounded-2xl flex flex-col overflow-hidden min-w-[300px]">
            {/* ... (Keep existing Column 2 content) ... */}
            <div className="p-4 border-b border-white/10 bg-black/20">
                <h3 className="text-white font-bold mb-1">
                   {activeEpisode ? `第${activeEpisode.sequence}集：${activeEpisode.title}` : '请选择分集'}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>智能分镜数量:</span>
                        <input 
                            type="number" 
                            value={shotCountTarget} 
                            onChange={e => setShotCountTarget(parseInt(e.target.value))}
                            className="w-10 bg-black/40 border border-white/10 rounded text-center text-cyan-400"
                        />
                    </div>
                    <button 
                        onClick={handleSmartShots}
                        disabled={isGeneratingShots}
                        className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full hover:bg-cyan-500/20 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingShots ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isGeneratingShots ? '生成中...' : '智能分镜'}
                    </button>
                </div>
            </div>
            <textarea 
                value={activeEpisode?.scriptContent || ''}
                onChange={(e) => handleScriptChange(e.target.value)}
                className="flex-1 w-full bg-transparent p-6 text-sm text-gray-300 leading-loose resize-none outline-none custom-scrollbar whitespace-pre-wrap"
                placeholder="在此编写本集剧情..."
            />
        </div>

        {/* COLUMN 3: Text Shots (Wide) */}
        <div className="w-[45%] bg-gray-900/60 backdrop-blur border border-white/10 rounded-2xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2"><Video size={18} /> 分镜列表</h3>
                {activeEpisode?.hasStoryboard ? (
                    <button 
                        onClick={onNavigateToStoryboard}
                        className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full hover:bg-green-500/30 transition-colors font-bold"
                    >
                        查看故事板
                    </button>
                ) : (
                    <button 
                        onClick={handleCreateStoryboardClick} // Trigger Modal
                        disabled={!activeEpisode?.textShots.length}
                        className="text-xs bg-cyan-500 text-black border border-cyan-500 px-4 py-1.5 rounded-full hover:bg-cyan-400 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        创建故事板
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {(!activeEpisode?.textShots || activeEpisode.textShots.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                        {isGeneratingShots ? <Loader2 size={40} className="animate-spin opacity-50 text-cyan-400" /> : <Wand2 size={40} className="opacity-20" />}
                        <p className="text-sm">{isGeneratingShots ? "AI 正在导演大片中..." : "点击左侧“智能分镜”生成内容"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {activeEpisode.textShots.map((shot, index) => (
                            <div key={shot.id} className="bg-black/40 border border-white/10 hover:border-cyan-500/50 rounded-lg p-3 group transition-all relative">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <span className="bg-cyan-900/50 text-cyan-400 text-[10px] px-1.5 py-0.5 rounded font-mono h-fit mt-0.5">#{index + 1}</span>
                                    
                                    {/* Editable Inputs */}
                                    <div className="flex gap-2 flex-1">
                                         <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 border border-transparent focus-within:border-cyan-500/30 flex-1 min-w-0">
                                            <Calendar size={10} className="text-gray-500 flex-shrink-0"/> 
                                            <input 
                                                value={shot.time} 
                                                onChange={e => updateShotField(shot.id, 'time', e.target.value)}
                                                className="bg-transparent text-[10px] text-gray-300 w-full outline-none py-1"
                                                placeholder="时间"
                                            />
                                         </div>
                                         <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 border border-transparent focus-within:border-cyan-500/30 flex-1 min-w-0">
                                            <MapPin size={10} className="text-gray-500 flex-shrink-0"/> 
                                            <input 
                                                value={shot.location} 
                                                onChange={e => updateShotField(shot.id, 'location', e.target.value)}
                                                className="bg-transparent text-[10px] text-gray-300 w-full outline-none py-1"
                                                placeholder="地点"
                                            />
                                         </div>
                                         <div className="flex items-center gap-1 bg-purple-900/20 rounded px-1.5 border border-purple-500/20 focus-within:border-purple-500/50 w-20 flex-shrink-0">
                                            <input 
                                                value={shot.angle} 
                                                onChange={e => updateShotField(shot.id, 'angle', e.target.value)}
                                                className="bg-transparent text-[10px] text-purple-400 w-full outline-none py-1 text-center"
                                                placeholder="镜头"
                                            />
                                         </div>
                                    </div>

                                    {/* Move Buttons */}
                                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {index > 0 && <button onClick={() => moveShot(index, index-1)} className="text-gray-500 hover:text-cyan-400"><ChevronUp size={12} /></button>}
                                        {index < activeEpisode.textShots.length - 1 && <button onClick={() => moveShot(index, index+1)} className="text-gray-500 hover:text-cyan-400"><ChevronDown size={12} /></button>}
                                    </div>
                                </div>

                                {/* Dialogue Input (Added) */}
                                <div className="flex items-start gap-2 bg-black/20 rounded p-1.5 mb-2 border border-white/5">
                                    <MessageSquare size={10} className="text-gray-500 mt-1 flex-shrink-0" />
                                    <textarea 
                                        value={shot.dialogue || ''}
                                        onChange={e => updateShotField(shot.id, 'dialogue', e.target.value)}
                                        className="w-full bg-transparent text-[10px] text-cyan-100/80 outline-none resize-none"
                                        rows={1}
                                        placeholder="对话内容..."
                                    />
                                </div>

                                {/* Editable Action */}
                                <textarea 
                                    value={shot.action}
                                    onChange={e => updateShotField(shot.id, 'action', e.target.value)}
                                    className="w-full bg-transparent text-xs text-gray-300 leading-relaxed pl-2 border-l-2 border-white/10 outline-none resize-none focus:border-cyan-500/50 transition-colors"
                                    rows={2}
                                    placeholder="描述分镜动作..."
                                />
                            </div>
                        ))}
                        <button className="w-full py-3 border border-dashed border-white/10 rounded-lg text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors text-xs">
                            + 手动添加分镜
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Style Selection Modal */}
        {showStyleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="bg-gray-900 border border-cyan-500/30 rounded-3xl p-8 w-full max-w-4xl shadow-[0_0_50px_rgba(34,211,238,0.1)] relative">
                    <button 
                        onClick={() => setShowStyleModal(false)}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Palette className="text-cyan-400" /> 选择艺术风格
                    </h2>
                    <p className="text-gray-400 mb-8">AI 将基于所选风格为您生成完整的人物设定与分镜画面。</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {ANIME_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    selectedStyle.id === style.id 
                                    ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                    : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                <div className={`w-full aspect-square rounded-lg mb-3 ${selectedStyle.id === style.id ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                                    {/* Placeholder for Style Preview Image if available */}
                                </div>
                                <h3 className={`font-bold text-sm ${selectedStyle.id === style.id ? 'text-white' : 'text-gray-300'}`}>{style.name}</h3>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={generateStoryboardWithAI}
                            disabled={isGeneratingStoryboard}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold px-10 py-4 rounded-full flex items-center gap-3 shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGeneratingStoryboard ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            {isGeneratingStoryboard ? 'AI 正在创作故事板...' : '开始创作 (Generate Storyboard)'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ScriptStep;