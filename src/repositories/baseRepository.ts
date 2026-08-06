import { saveFirestoreDoc, deleteFirestoreDoc, saveFullCollection, subscribeCollection } from '../lib/firebase';

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

  public subscribe(initialItems: T[], onUpdate: (items: T[]) => void): () => void {
    return subscribeCollection<T>(this.collectionName, initialItems, onUpdate);
  }
}
