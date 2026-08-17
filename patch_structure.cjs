const fs = require('fs');
let content = fs.readFileSync('src/components/StructureModule.tsx', 'utf8');

const regex = /const findMatchingMemberForOfficer = \(p: PengurusItem\): Member \| null => \{[\s\S]*?return members\.find\(m => m\.nik && matchNik\(m\.nik, pNik\)\) \|\| null;\s*\};/m;

const replacement = `
  const [pengurusMembers, setPengurusMembers] = useState<Member[]>([]);
  useEffect(() => {
    let isMounted = true;
    const fetchP = async () => {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const q = query(collection(db, 'members'), where('jabatanOrganisasi', '!=', 'Anggota'));
        const snap = await getDocs(q);
        if (isMounted) {
          setPengurusMembers(snap.docs.map(d => d.data() as Member));
        }
      } catch(e) {
        console.warn(e);
      }
    };
    fetchP();
    return () => { isMounted = false; };
  }, []);

  const findMatchingMemberForOfficer = (p: PengurusItem): Member | null => {
    const pNik = (p.nik || '').trim();
    if (!pNik) return null;
    return pengurusMembers.find(m => m.nik && matchNik(m.nik, pNik)) || null;
  };
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/StructureModule.tsx', content);
