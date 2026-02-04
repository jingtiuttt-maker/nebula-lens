export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  lastModified: string;
  episodes?: Episode[];
  folderId?: string; // Link to a folder
  entities?: Entity[]; // Custom entities created in this project
}

export interface Episode {
  id: string;
  sequence: number;
  title: string;
  scriptContent: string;
  textShots: TextShot[]; 
  visualShots: Shot[];   
  hasStoryboard: boolean;
}

export interface TextShot {
  id: string;
  time: string;
  location: string;
  action: string;
  angle: string;
  dialogue?: string; // Added dialogue field
}

export interface Folder {
  id: string;
  name: string;
}

export interface Entity {
  id: string;
  type: 'character' | 'environment';
  name: string;
  avatar: string; 
  voice?: string; 
  description?: string;
}

export interface ShotHistory {
  id: string;
  url: string;
  type: 'image' | 'video';
  timestamp: number;
}

export interface Shot {
  id: string;
  sequence: number;
  currentVisual: string;
  visualType: 'image' | 'video';
  history: ShotHistory[];
  characterId: string;
  angle: string;
  dialogue: string;
  imagePrompt: string;
  videoPrompt: string;
  environmentId: string;
}

export enum AppState {
  HOME = 'HOME',
  PROJECTS = 'PROJECTS',
  CREATION = 'CREATION'
}

export enum CreationStep {
  SCRIPT = 'SCRIPT',
  STORYBOARD = 'STORYBOARD',
  FINAL_CUT = 'FINAL_CUT'
}