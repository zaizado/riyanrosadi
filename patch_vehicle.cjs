const fs = require('fs');
let content = fs.readFileSync('src/components/vehicle/VehicleRequestFormTab.tsx', 'utf8');

const regex = /\/\/ If currentUser has matched member profile[\s\S]*?\}, \[currentUser, members\]\);/;

const replacement = `
  // If currentUser has matched member profile
  useEffect(() => {
    let isMounted = true;
    if (currentUser.memberId || currentUser.nik) {
      const fetchMatch = async () => {
        try {
          const { getDocs, query, collection, where } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          let q;
          if (currentUser.memberId) {
            q = query(collection(db, 'members'), where('id', '==', currentUser.memberId));
          } else {
            q = query(collection(db, 'members'), where('nik', '==', currentUser.nik));
          }
          const snap = await getDocs(q);
          if (isMounted && !snap.empty) {
            const match = snap.docs[0].data() as Member;
            setSelectedMember(match);
            setNamaPemohon(match.namaLengkap);
            setDepartemenPemohon(match.departemen || 'PTP SBN KASBI');
            if (match.nomorHp) setKontakPemohon(match.nomorHp);
          }
        } catch (e) {}
      };
      fetchMatch();
    }
    return () => { isMounted = false; };
  }, [currentUser]);
`;

content = content.replace(regex, replacement.trim());
fs.writeFileSync('src/components/vehicle/VehicleRequestFormTab.tsx', content);
