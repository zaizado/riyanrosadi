const fs = require('fs');
let content = fs.readFileSync('src/components/MembersModule.tsx', 'utf8');

// 1. make it async
content = content.replace(/const analyzeRawImportData = \(rows: any\[\], fileName: string\) => \{/, "const analyzeRawImportData = async (rows: any[], fileName: string) => {");

// 2. Add fetching logic right after batchId generation
const regexFetch = /\/\/ 3\. Categorize against existing Firestore members database\s*const existingMembersByNik = new Map<string, Member>\(\);\s*members\.forEach\(m => \{/;

const replacementFetch = `
    // 3. Categorize against existing Firestore members database
    const { getDocs, collection } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    const existingSnap = await getDocs(collection(db, 'members'));
    const allMembers = existingSnap.docs.map(d => ({ ...d.data(), id: d.id } as Member));

    const existingMembersByNik = new Map<string, Member>();
    allMembers.forEach(m => {
`;

content = content.replace(regexFetch, replacementFetch.trim());

// 3. Replace 'members.forEach' for inactive logic
const regexInactive = /\/\/ 🔴 MENJADI TIDAK AKTIF \(Members in Firestore but missing in Excel\)\s*members\.forEach\(m => \{/;
const replacementInactive = `
    // 🔴 MENJADI TIDAK AKTIF (Members in Firestore but missing in Excel)
    allMembers.forEach(m => {
`;

content = content.replace(regexInactive, replacementInactive.trim());

// 4. Also replace the nomorAnggota calculation which used `members.length`
const regexNomor1 = /nomorAnggota: `SBN-VCI-\$\{String\(members\.length \+ newMembers\.length \+ 1\)\.padStart\(4, '0'\)\}`,/g;
const replacementNomor1 = "nomorAnggota: `SBN-VCI-${String(allMembers.length + newMembers.length + 1).padStart(4, '0')}`,";
content = content.replace(regexNomor1, replacementNomor1);

const regexNomor2 = /nomorAnggota: `SBN-VCI-\$\{String\(members\.length \+ 1\)\.padStart\(4, '0'\)\}`,/g;
const replacementNomor2 = "nomorAnggota: `SBN-VCI-${String(allMembers.length + 1).padStart(4, '0')}`,";
content = content.replace(regexNomor2, replacementNomor2);

fs.writeFileSync('src/components/MembersModule.tsx', content);
