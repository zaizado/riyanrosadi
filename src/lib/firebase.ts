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
  getDocs,
  query,
  QueryConstraint
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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

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

// Initialize Firebase Storage
export const storage = getStorage(app);

export const uploadFileToStorage = async (
  path: string, 
  file: File
): Promise<{ downloadUrl: string; storagePath: string }> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return {
    downloadUrl,
    storagePath: snapshot.ref.fullPath
  };
};

export const deleteFileFromStorage = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err: any) {
    console.warn("Storage delete warning:", err?.message || err);
  }
};

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

import { syncManager } from './syncManager';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  return errInfo;
}

// Generic Realtime Subscription for Firestore collection - Firestore is Single Source of Truth
export const subscribeCollection = <T extends { id: string }>(
  collectionName: string,
  initialItems: T[],
  onUpdate: (items: T[]) => void,
  onError?: (err: Error) => void,
  queryConstraints?: QueryConstraint[]
) => {
  const colRef = collection(db, collectionName);
  const firestoreQuery = queryConstraints && queryConstraints.length > 0
    ? query(colRef, ...queryConstraints)
    : colRef;

  const unsubscribe = onSnapshot(
    firestoreQuery,
    (snapshot) => {
      const isFromCache = snapshot.metadata.fromCache;
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;
      syncManager.reportListenerUpdate(collectionName, isFromCache, hasPendingWrites);

      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const items = snapshot.docs.map(docSnap => ({
          ...(docSnap.data() as T),
          id: docSnap.id
        }));
        onUpdate(items);
      }
    },
    (error) => {
      console.warn(`Firestore subscription error for collection '${collectionName}':`, error.message);
      syncManager.reportListenerError(collectionName, error);
      handleFirestoreError(error, OperationType.LIST, collectionName);
      if (onError) {
        onError(error);
      }
    }
  );

  return () => {
    syncManager.reportListenerUnsubscribe(collectionName);
    unsubscribe();
  };
};

// Generic Realtime Subscription for a single document in Firestore
export const subscribeDocument = <T extends { id: string }>(
  collectionName: string,
  docId: string,
  onUpdate: (item: T | null) => void,
  onError?: (err: Error) => void
) => {
  if (!docId) {
    onUpdate(null);
    return () => {};
  }
  const documentRef = doc(db, collectionName, docId);

  const unsubscribe = onSnapshot(
    documentRef,
    (docSnap) => {
      const isFromCache = docSnap.metadata.fromCache;
      const hasPendingWrites = docSnap.metadata.hasPendingWrites;
      syncManager.reportListenerUpdate(`${collectionName}/${docId}`, isFromCache, hasPendingWrites);

      if (docSnap.exists()) {
        const item = {
          ...(docSnap.data() as T),
          id: docSnap.id
        };
        onUpdate(item);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn(`Firestore subscription error for document '${collectionName}/${docId}':`, error.message);
      syncManager.reportListenerError(`${collectionName}/${docId}`, error);
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
      if (onError) {
        onError(error);
      }
    }
  );

  return () => {
    syncManager.reportListenerUnsubscribe(`${collectionName}/${docId}`);
    unsubscribe();
  };
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
  try {
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${item.id}`);
    throw error;
  }
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
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
      throw error;
    }
  }
};

// Delete single item - throws on error
export const deleteFirestoreDoc = async (
  collectionName: string, 
  id: string
) => {
  const docRef = doc(db, collectionName, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    throw error;
  }
};

