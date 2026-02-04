import React, { useState, useEffect } from 'react';
import StarField from './components/StarField';
import BottomNav from './components/BottomNav';
import Home from './views/Home';
import ProjectView from './views/ProjectView';
import CreationView from './views/CreationView';
import { AppState, Project, Folder } from './types';
import { MOCK_PROJECTS, MOCK_FOLDERS } from './constants';
import { db, collection, onSnapshot, setDoc, doc, deleteDoc } from './firebase';

// Define Position Type locally or import if shared
export interface NodePosition {
  x: number;
  y: number;
  scale: number;
}

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [creationFolderId, setCreationFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Persistent State Initialization (Firestore) ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});

  // --- Firestore Subscriptions ---

  useEffect(() => {
    // Subscribe to Projects
    const unsubscribeProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
        const loadedProjects: Project[] = [];
        snapshot.forEach((doc) => {
            loadedProjects.push(doc.data() as Project);
        });
        // Fallback to MOCK if empty (for demo purposes)
        if (loadedProjects.length === 0 && !snapshot.metadata.fromCache) {
             setProjects(MOCK_PROJECTS);
             // Optionally write mocks to DB here if you want auto-seed
        } else {
             setProjects(loadedProjects);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Firestore Error:", error);
        // Fallback if config is missing or error
        setProjects(MOCK_PROJECTS);
        setIsLoading(false);
    });

    // Subscribe to Folders
    const unsubscribeFolders = onSnapshot(collection(db, "folders"), (snapshot) => {
        const loadedFolders: Folder[] = [];
        snapshot.forEach((doc) => {
            loadedFolders.push(doc.data() as Folder);
        });
        if (loadedFolders.length === 0) {
            setFolders(MOCK_FOLDERS);
        } else {
            setFolders(loadedFolders);
        }
    });

    // Subscribe to Node Positions (optional, store in a single doc 'settings/positions')
    const unsubscribePositions = onSnapshot(doc(db, "settings", "positions"), (doc) => {
        if (doc.exists()) {
            setNodePositions(doc.data() as Record<string, NodePosition>);
        }
    });

    return () => {
        unsubscribeProjects();
        unsubscribeFolders();
        unsubscribePositions();
    };
  }, []);

  // --- Save Handlers ---

  const handleSaveProject = async (project: Project) => {
    // Optimistic Update
    setProjects(prev => {
      const exists = prev.find(p => p.id === project.id);
      if (exists) {
        return prev.map(p => p.id === project.id ? project : p);
      }
      return [...prev, project];
    });

    try {
        await setDoc(doc(db, "projects", project.id), project);
    } catch (e) {
        console.error("Error saving project:", e);
    }
  };

  const handleSaveFolders = async (newFolders: Folder[]) => {
      setFolders(newFolders);
      // Batch save isn't simple in this helper, so we loop or save individual
      // For this demo, we assume the specific folder update calls this.
      // Better: Update ProjectView to save individual folders.
      // But to match prop signature:
      newFolders.forEach(async f => {
          await setDoc(doc(db, "folders", f.id), f);
      });
  };

  const handleSavePositions = async (newPositions: Record<string, NodePosition>) => {
      setNodePositions(newPositions);
      try {
        await setDoc(doc(db, "settings", "positions"), newPositions);
      } catch (e) { /* ignore */ }
  };

  const handleCreate = (folderId?: string) => {
    setActiveProjectId(null);
    setCreationFolderId(folderId || null);
    setAppState(AppState.CREATION);
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCreationFolderId(null);
    setAppState(AppState.CREATION);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Background */}
      {appState !== AppState.CREATION && <StarField />}

      {/* Loading State */}
      {isLoading && projects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
              <div className="text-cyan-400 animate-pulse">Loading Universe...</div>
          </div>
      )}

      {/* Views */}
      {appState === AppState.HOME && (
        <Home 
          projects={projects} 
          onOpen={handleOpenProject}
          nodePositions={nodePositions}
          setNodePositions={(val) => {
             // If val is a function (React state updater), resolve it
             const newVal = typeof val === 'function' ? val(nodePositions) : val;
             handleSavePositions(newVal);
          }}
        />
      )}
      
      {appState === AppState.PROJECTS && (
        <ProjectView 
          projects={projects}
          folders={folders}
          setProjects={setProjects} // This is local state updater, changes sync via onUpdate in components usually
          setFolders={(val) => {
              const newVal = typeof val === 'function' ? val(folders) : val;
              handleSaveFolders(newVal);
          }}
          onBack={() => setAppState(AppState.HOME)} 
          onCreate={handleCreate}
          onOpen={handleOpenProject}
          onDeleteProject={async (id) => {
              // Use imported deleteDoc directly to avoid dynamic import mismatch
              await deleteDoc(doc(db, "projects", id));
          }}
        />
      )}

      {appState === AppState.CREATION && (
        <CreationView 
          initialProjectId={activeProjectId}
          defaultFolderId={creationFolderId}
          existingProjects={projects}
          folders={folders}
          setFolders={(val) => {
            const newVal = typeof val === 'function' ? val(folders) : val;
            handleSaveFolders(newVal);
          }}
          onSaveProject={handleSaveProject}
          onBack={() => setAppState(AppState.PROJECTS)} 
        />
      )}

      {/* Persistent Navigation */}
      <BottomNav 
        appState={appState} 
        setAppState={setAppState} 
        onCreate={() => handleCreate()} 
      />
      
    </div>
  );
}

export default App;