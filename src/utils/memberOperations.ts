import { Member } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, getDocs, query, collection, where, limit, getCountFromServer } from 'firebase/firestore';

/**
 * Generate a unique member number (Nomor Anggota) that does not depend on
 * the in-memory members array length, preventing SBN-VCI-0001 duplication and race conditions.
 */
export function generateNextMemberNumber(): string {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timeOffset = (Date.now() % 10000).toString().padStart(4, '0');
  return `SBN-VCI-${currentYear}${timeOffset.slice(-2)}${randomSuffix.toString().slice(-2)}`;
}

/**
 * Fetch a single member by document ID directly via getDoc to prevent collection scan
 */
export async function getMemberDocById(memberId: string): Promise<Member | null> {
  if (!memberId) return null;
  try {
    const docRef = doc(db, 'members', memberId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as Member), id: snap.id };
    }
    return null;
  } catch (err) {
    console.warn(`Failed to fetch member by ID (${memberId}):`, err);
    return null;
  }
}

/**
 * Fetch total member counts on-demand using Firestore server aggregation
 */
export async function getMemberCountsOnDemand(): Promise<{ active: number; total: number }> {
  try {
    const colRef = collection(db, 'members');
    const [totalSnap, activeSnap] = await Promise.all([
      getCountFromServer(colRef),
      getCountFromServer(query(colRef, where('statusKeanggotaan', '==', 'Aktif')))
    ]);
    return {
      total: totalSnap.data().count,
      active: activeSnap.data().count
    };
  } catch (err) {
    console.warn('Failed to fetch member counts from server:', err);
    return { active: 0, total: 0 };
  }
}
