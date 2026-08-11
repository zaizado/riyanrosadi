import { initializeApp, getApps, getApp, setLogLevel } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs 
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';

// Silence standard connection retry warnings in console/metadata
setLogLevel('error');
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Member, 
  AdvocacyCase, 
  SickVisit, 
  OrganizationAgenda, 
  SembakoEvent, 
  SembakoClaim, 
  UserAccount, 
  AuditLog 
} from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with auto detect long polling for stable container sandbox connectivity
export const db = (() => {
  try {
    return firebaseConfig.firestoreDatabaseId 
      ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (err) {
    return firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Helper to remove undefined properties which Firestore rejects
const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
};

// Generic Realtime Subscription for Firestore collection - Firestore is Single Source of Truth
export const subscribeCollection = <T extends { id: string }>(
  collectionName: string,
  initialItems: T[],
  onUpdate: (items: T[]) => void,
  onError?: (err: Error) => void
) => {
  const colRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      onUpdate([]);
    } else {
      const items = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as T),
        id: docSnap.id
      }));
      onUpdate(items);
    }
  }, (error) => {
    console.warn(`Firestore subscription error for collection '${collectionName}':`, error.message);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};

// Save single item with timestamp - throws on error so caller can handle failure
export const saveFirestoreDoc = async <T extends { id: string }>(
  collectionName: string, 
  item: T
) => {
  const docRef = doc(db, collectionName, item.id);
  let itemToSave: any = { 
    ...item,
    updatedAt: new Date().toISOString()
  };
  if (itemToSave.avatarUrl && typeof itemToSave.avatarUrl === 'string' && itemToSave.avatarUrl.length > 500000) {
    itemToSave.avatarUrl = '/che_avatar.jpg';
  }
  if (itemToSave.fotoUrl && typeof itemToSave.fotoUrl === 'string' && itemToSave.fotoUrl.length > 500000) {
    itemToSave.fotoUrl = '/che_avatar.jpg';
  }
  const cleaned = cleanForFirestore(itemToSave);
  await setDoc(docRef, cleaned, { merge: true });
};

// Batch merge collection without destructive total wipes
export const saveFullCollection = async <T extends { id: string }>(
  collectionName: string,
  items: T[]
) => {
  const colRef = collection(db, collectionName);

  for (let i = 0; i < items.length; i += 400) {
    const chunk = items.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const docRef = doc(colRef, item.id);
      let itemToSave: any = { 
        ...item,
        updatedAt: new Date().toISOString()
      };
      if (itemToSave.avatarUrl && typeof itemToSave.avatarUrl === 'string' && itemToSave.avatarUrl.length > 500000) {
        itemToSave.avatarUrl = '/che_avatar.jpg';
      }
      if (itemToSave.fotoUrl && typeof itemToSave.fotoUrl === 'string' && itemToSave.fotoUrl.length > 500000) {
        itemToSave.fotoUrl = '/che_avatar.jpg';
      }
      const cleaned = cleanForFirestore(itemToSave);
      batch.set(docRef, cleaned, { merge: true });
    });
    await batch.commit();
  }
};

// Delete single item - throws on error
export const deleteFirestoreDoc = async (
  collectionName: string, 
  id: string
) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

