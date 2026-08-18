import { saveFirestoreDoc, deleteFirestoreDoc, saveFullCollection, subscribeCollection, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { QueryConstraint, doc, getDoc, collection, getDocs, query, getCountFromServer } from 'firebase/firestore';

export abstract class BaseRepository<T extends { id: string }> {
  protected constructor(protected collectionName: string) {}

  public async save(item: T): Promise<void> {
    await saveFirestoreDoc(this.collectionName, item);
  }

  public async saveAll(items: T[]): Promise<void> {
    await saveFullCollection(this.collectionName, items);
  }

  public async delete(id: string): Promise<void> {
    await deleteFirestoreDoc(this.collectionName, id);
  }

  public async getById(id: string): Promise<T | null> {
    if (!id) return null;
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...(snap.data() as T), id: snap.id };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${id}`);
      throw error;
    }
  }

  public async getAll(queryConstraints?: QueryConstraint[]): Promise<T[]> {
    try {
      const colRef = collection(db, this.collectionName);
      const q = queryConstraints && queryConstraints.length > 0
        ? query(colRef, ...queryConstraints)
        : colRef;
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...(d.data() as T), id: d.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
      throw error;
    }
  }

  public async getCount(queryConstraints?: QueryConstraint[]): Promise<number> {
    try {
      const colRef = collection(db, this.collectionName);
      const q = queryConstraints && queryConstraints.length > 0
        ? query(colRef, ...queryConstraints)
        : colRef;
      const snap = await getCountFromServer(q);
      return snap.data().count;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, this.collectionName);
      throw error;
    }
  }

  public subscribe(
    initialItems: T[], 
    onUpdate: (items: T[]) => void, 
    onError?: (err: Error) => void,
    queryConstraints?: QueryConstraint[]
  ): () => void {
    return subscribeCollection<T>(this.collectionName, initialItems, onUpdate, onError, queryConstraints);
  }
}
