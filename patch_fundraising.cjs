const fs = require('fs');
let content = fs.readFileSync('src/components/FundraisingModule.tsx', 'utf8');

const regex = /const targetMbr = members\.find\(m => m\.id === camp\.memberId \|\| m\.nik === camp\.nikAnggota\);\s*setSelectedMemberObj\(targetMbr \|\| null\);/g;

const replacement = `
    const fetchTargetMbr = async () => {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const q = query(collection(db, 'members'), where('id', '==', camp.memberId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setSelectedMemberObj(snap.docs[0].data() as Member);
        } else {
          setSelectedMemberObj(null);
        }
      } catch(e) {
        console.error(e);
      }
    };
    fetchTargetMbr();
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/FundraisingModule.tsx', content);
