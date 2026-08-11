import { initializeApp, getApps, getApp, setLogLevel } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs 
} from 'firebase/firestore';

// Silence standard connection retry warnings in console/metadata
setLogLevel('error');
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  INITIAL_USERS, 
  INITIAL_MEMBERS, 
  INITIAL_ADVOCACY, 
  INITIAL_SICK_VISITS, 
  INITIAL_AGENDAS, 
  INITIAL_SEMBAKO_EVENTS, 
  INITIAL_SEMBAKO_CLAIMS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';
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

// Initialize Firestore with specific database ID if present in config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper to seed initial collection if empty
const seedIfEmpty = async <T extends { id: string }>(
  collectionName: string, 
  initialItems: T[]
) => {
  try {
    const colRef = collection(db, collectionName);
    // Batch write initial items in chunks of 400 (Firestore limit is 500)
    for (let i = 0; i < initialItems.length; i += 400) {
      const chunk = initialItems.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(item => {
        const docRef = doc(colRef, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error seeding ${collectionName}:`, err);
  }
};

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

// Generic Realtime Subscription for array data with offline cache & local storage fallback
export const subscribeCollection = <T extends { id: string }>(
  collectionName: string,
  initialItems: T[],
  onUpdate: (items: T[]) => void
) => {
  const colRef = collection(db, collectionName);
  const seedKey = `sbn_vci_has_seeded_${collectionName}`;
  const cacheKey = `sbn_vci_cache_${collectionName}`;

  // Instant render from local cache if available
  try {
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      const cachedItems = JSON.parse(cachedStr);
      if (Array.isArray(cachedItems) && cachedItems.length > 0) {
        onUpdate(cachedItems);
      }
    }
  } catch (e) {
    // Ignore cache parse error
  }

  const unsubscribe = onSnapshot(colRef, (snapshot) => {
    const hasSeeded = localStorage.getItem(seedKey) === 'true';

    if (snapshot.empty) {
      if (!hasSeeded && initialItems.length > 0) {
        localStorage.setItem(seedKey, 'true');
        seedIfEmpty(collectionName, initialItems);
        onUpdate(initialItems);
        try { localStorage.setItem(cacheKey, JSON.stringify(initialItems)); } catch (e) {}
      } else {
        localStorage.setItem(seedKey, 'true');
        onUpdate([]);
        try { localStorage.setItem(cacheKey, JSON.stringify([])); } catch (e) {}
      }
    } else {
      localStorage.setItem(seedKey, 'true');
      const items = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as T),
        id: docSnap.id
      }));
      onUpdate(items);
      try { localStorage.setItem(cacheKey, JSON.stringify(items)); } catch (e) {}
    }
  }, (error) => {
    console.warn(`Firestore connection status note for ${collectionName}: operating in local offline mode (${error.message})`);
    // Fallback to local storage cache or initial items if network unavailable
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cachedItems = JSON.parse(cachedStr);
        if (Array.isArray(cachedItems) && cachedItems.length > 0) {
          onUpdate(cachedItems);
          return;
        }
      }
    } catch (e) {}
    if (initialItems && initialItems.length > 0) {
      onUpdate(initialItems);
    }
  });

  return unsubscribe;
};

// Save single item with timestamp and versioning
export const saveFirestoreDoc = async <T extends { id: string }>(
  collectionName: string, 
  item: T
) => {
  try {
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
  } catch (err) {
    console.error(`Error saving to ${collectionName}:`, err);
  }
};

// Batch merge collection (for imports / sync) without destructive total wipes
export const saveFullCollection = async <T extends { id: string }>(
  collectionName: string,
  items: T[]
) => {
  try {
    const colRef = collection(db, collectionName);

    // Set/update all items in chunks of 400 with merge
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
  } catch (err) {
    console.error(`Error updating collection batch for ${collectionName}:`, err);
  }
};

// Delete single item
export const deleteFirestoreDoc = async (
  collectionName: string, 
  id: string
) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting from ${collectionName}:`, err);
  }
};
