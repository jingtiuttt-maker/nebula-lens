import { Folder, Project, Shot, Entity, Episode, TextShot } from './types';

export const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', name: '仙侠系列' },
  { id: 'f2', name: '赛博朋克' },
  { id: 'f3', name: '悬疑惊悚' },
];

// --- Xianxia Assets ---
const AVATAR_LING = "https://picsum.photos/seed/ling/100/100";
const AVATAR_MASTER = "https://picsum.photos/seed/master/100/100";
const ENV_MOUNTAIN = "https://picsum.photos/seed/mountain/100/100";
const ENV_PALACE = "https://picsum.photos/seed/palace/100/100";

export const INITIAL_ENTITIES: Entity[] = [
  { id: 'c1', type: 'character', name: '林青羽 (Ling)', avatar: AVATAR_LING, voice: '清澈少年音' },
  { id: 'c2', type: 'character', name: '玄虚真人 (Master)', avatar: AVATAR_MASTER, voice: '威严长者音' },
  { id: 'e1', type: 'environment', name: '云隐峰', avatar: ENV_MOUNTAIN },
  { id: 'e2', type: 'environment', name: '紫霄大殿', avatar: ENV_PALACE },
];

// --- Mock Episodes Data ---

const TEXT_SHOTS_EP1: TextShot[] = [
  { id: 'ts1', time: '日 / 外', location: '云隐峰绝壁', action: '林青羽攀爬在悬崖峭壁之上，手指磨出血痕。', angle: '大远景', dialogue: '' },
  { id: 'ts2', time: '日 / 外', location: '云隐峰绝壁', action: '林青羽咬牙坚持，汗水滴落。', angle: '面部特写', dialogue: '' },
  { id: 'ts3', time: '日 / 外', location: '云隐峰顶', action: '林青羽翻上崖顶，力竭倒地。', angle: '全景', dialogue: '' },
  { id: 'ts4', time: '日 / 外', location: '云隐峰顶', action: '玄虚真人站在逆光处，俯视林青羽。', angle: '仰拍', dialogue: '' },
  { id: 'ts5', time: '日 / 外', location: '云隐峰顶', action: '林青羽抬头，眼神倔强。', angle: '主观镜头', dialogue: '' },
  { id: 'ts6', time: '日 / 外', location: '云隐峰顶', action: '玄虚真人：“凡人之躯，竟能登顶？”', angle: '中景', dialogue: '玄虚真人：凡人之躯，竟能登顶？' },
  { id: 'ts7', time: '日 / 外', location: '云隐峰顶', action: '林青羽：“我要修仙！”', angle: '近景', dialogue: '林青羽：我要修仙！' },
  { id: 'ts8', time: '日 / 外', location: '云隐峰顶', action: '云海翻腾，一只仙鹤飞过。', angle: '空镜', dialogue: '' },
  { id: 'ts9', time: '日 / 外', location: '云隐峰顶', action: '玄虚真人挥手，一道金光笼罩林青羽。', angle: '特效特写', dialogue: '' },
  { id: 'ts10', time: '日 / 外', location: '云隐峰顶', action: '林青羽惊讶地看着自己的双手。', angle: '过肩镜头', dialogue: '' },
];

const VISUAL_SHOTS_EP1: Shot[] = [
  { id: 's1', sequence: 1, currentVisual: 'https://picsum.photos/seed/cliff/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '大远景', dialogue: '', imagePrompt: '悬崖峭壁，渺小的人影在攀爬，云雾缭绕', videoPrompt: '镜头缓慢拉远，展示山峰的险峻', environmentId: 'e1' },
  { id: 's2', sequence: 2, currentVisual: 'https://picsum.photos/seed/face/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '特写', dialogue: '(喘息声)', imagePrompt: '少年面部特写，汗水，坚毅的眼神', videoPrompt: '', environmentId: 'e1' },
  { id: 's3', sequence: 3, currentVisual: 'https://picsum.photos/seed/top/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '全景', dialogue: '', imagePrompt: '少年翻上山顶，倒在草地上', videoPrompt: '', environmentId: 'e1' },
  { id: 's4', sequence: 4, currentVisual: 'https://picsum.photos/seed/master/800/450', visualType: 'image', history: [], characterId: 'c2', angle: '仰拍', dialogue: '', imagePrompt: '逆光的老者身影，仙风道骨', videoPrompt: '老者衣摆随风飘动', environmentId: 'e1' },
  { id: 's5', sequence: 5, currentVisual: 'https://picsum.photos/seed/linglook/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '特写', dialogue: '我做到了...', imagePrompt: '少年抬头仰视，满脸泥土但眼神明亮', videoPrompt: '', environmentId: 'e1' },
  { id: 's6', sequence: 6, currentVisual: 'https://picsum.photos/seed/talk/800/450', visualType: 'image', history: [], characterId: 'c2', angle: '中景', dialogue: '凡人之躯，竟能登顶？', imagePrompt: '老者抚须，神情淡然', videoPrompt: '', environmentId: 'e1' },
  { id: 's7', sequence: 7, currentVisual: 'https://picsum.photos/seed/shout/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '近景', dialogue: '我要修仙！', imagePrompt: '少年大喊，坚定', videoPrompt: '', environmentId: 'e1' },
  { id: 's8', sequence: 8, currentVisual: 'https://picsum.photos/seed/cloud/800/450', visualType: 'video', history: [], characterId: 'e1', angle: '空镜', dialogue: '', imagePrompt: '云海翻腾，仙鹤飞过', videoPrompt: '云雾快速流动，仙鹤飞过画面', environmentId: 'e1' },
  { id: 's9', sequence: 9, currentVisual: 'https://picsum.photos/seed/magic/800/450', visualType: 'image', history: [], characterId: 'c2', angle: '特写', dialogue: '', imagePrompt: '金光特效，粒子效果', videoPrompt: '', environmentId: 'e1' },
  { id: 's10', sequence: 10, currentVisual: 'https://picsum.photos/seed/hands/800/450', visualType: 'image', history: [], characterId: 'c1', angle: '过肩', dialogue: '这是...', imagePrompt: '看着发光的双手，背景是模糊的老者', videoPrompt: '', environmentId: 'e1' },
];

export const MOCK_EPISODES: Episode[] = [
  {
    id: 'ep1',
    sequence: 1,
    title: '第一集：凡人问天',
    scriptContent: `场景：云隐峰 - 日\n\n林青羽徒手攀爬万仞绝壁，十指鲜血淋漓。他是个毫无灵根的凡人，却妄想登上仙门。\n\n林青羽\n（喘息）\n我绝不认命！\n\n峰顶，玄虚真人负手而立，看着爬上来的少年。\n\n玄虚真人\n凡人之躯，竟能登顶？\n\n林青羽\n我要修仙！\n\n玄虚真人挥手，一道金光没入林青羽体内。`,
    textShots: TEXT_SHOTS_EP1,
    visualShots: VISUAL_SHOTS_EP1,
    hasStoryboard: true
  },
  {
    id: 'ep2',
    sequence: 2,
    title: '第二集：紫霄试炼',
    scriptContent: `场景：紫霄大殿 - 内\n\n大殿金碧辉煌，数百弟子列队。林青羽站在最后，衣衫褴褛。\n\n众弟子窃窃私语。\n\n弟子甲\n那是谁？乞丐也能进大殿？\n\n玄虚真人坐于高台。\n\n玄虚真人\n今日试炼，测灵根。\n\n轮到林青羽，测灵石毫无反应。全场寂静。`,
    textShots: TEXT_SHOTS_EP1.map(s => ({...s, id: s.id + 'ep2', location: '紫霄大殿'})), // Mock data reuse
    visualShots: VISUAL_SHOTS_EP1.map(s => ({...s, id: s.id + 'ep2', environmentId: 'e2', currentVisual: 'https://picsum.photos/seed/palace2/800/450'})), // Mock data reuse
    hasStoryboard: true
  },
  {
    id: 'ep3',
    sequence: 3,
    title: '第三集：魔踪初现',
    scriptContent: `场景：后山禁地 - 夜\n\n林青羽独自练剑，虽无灵力，剑招却异常凌厉。忽然，一阵黑雾涌动。\n\n神秘声音\n想要力量吗？\n\n林青羽警觉回身。\n\n林青羽\n谁？！`,
    textShots: [],
    visualShots: [],
    hasStoryboard: false
  },
  {
    id: 'ep4',
    sequence: 4,
    title: '第四集：古剑觉醒',
    scriptContent: `场景：剑冢 - 黄昏\n\n万剑齐鸣。一把生锈的铁剑飞过林青羽。`,
    textShots: [],
    visualShots: [],
    hasStoryboard: false
  },
  {
    id: 'ep5',
    sequence: 5,
    title: '第五集：逆天改命',
    scriptContent: `场景：天劫台 - 雷雨\n\n林青羽手持锈剑，直指苍穹。天雷滚滚。`,
    textShots: [],
    visualShots: [],
    hasStoryboard: false
  }
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', title: '云隐仙途', thumbnail: 'https://picsum.photos/seed/xianxia/400/600', lastModified: '刚刚', episodes: MOCK_EPISODES },
  { id: 'p2', title: '霓虹之夜', thumbnail: 'https://picsum.photos/seed/cyber/400/600', lastModified: '2小时前', episodes: [] },
  { id: 'p3', title: '恐怖游轮', thumbnail: 'https://picsum.photos/seed/horror/400/600', lastModified: '1天前', episodes: [] },
];

export const INITIAL_SHOTS = VISUAL_SHOTS_EP1; // Default for backward compatibility if needed

export const ANGLES = [
  "大远景 (Extreme Long Shot)",
  "全景 (Wide Shot)",
  "中景 (Medium Shot)",
  "近景 (Close Shot)",
  "特写 (Close Up)",
  "大特写 (Extreme Close Up)",
  "仰拍 (Low Angle)",
  "俯拍 (High Angle)",
  "过肩镜头 (Over the Shoulder)",
  "主观镜头 (POV)"
];