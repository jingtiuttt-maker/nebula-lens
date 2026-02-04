import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const rawConfig = {
  apiKey: "AIzaSyAkQPxLYvoE9-gyupOQEPAVS_qfQmlqEz8",
  authDomain: "nebulalensai.firebaseapp.com",
  projectId: "nebulalensai",
  storageBucket: "nebulalensai.appspot.com",
  messagingSenderId: "", 
  appId: ""
};

// Filter out empty keys (like appId) which cause initializeApp to throw errors
const firebaseConfig = Object.fromEntries(
  Object.entries(rawConfig).filter(([_, v]) => v !== "")
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper function to upload file
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

// Export Firestore functions for usage in components
export { collection, addDoc, setDoc, doc, deleteDoc, onSnapshot, query, orderBy };
