const fs = require('fs');
let content = fs.readFileSync('src/components/SembakoModule.tsx', 'utf8');

const regex = /const activeMembers = members\.filter\(m => m\.statusKeanggotaan === 'Aktif'\);[\s\S]*?const initialClaimsList: SembakoClaim\[\] = activeMembers\.map\(\(m, idx\) => \(\{/m;

const replacement = `
    const { getDocs, query, collection, where } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    const q = query(collection(db, 'members'), where('statusKeanggotaan', '==', 'Aktif'));
    const snap = await getDocs(q);
    const activeMembers = snap.docs.map(d => ({ ...d.data(), id: d.id } as Member));

    const initialClaimsList: SembakoClaim[] = activeMembers.map((m, idx) => ({
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/SembakoModule.tsx', content);
