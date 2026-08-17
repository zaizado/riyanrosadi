const fs = require('fs');
let content = fs.readFileSync('src/components/MembersModule.tsx', 'utf8');

const replacement = `
  const [serverMembers, setServerMembers] = useState<Member[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(false);
  const [hasMoreServer, setHasMoreServer] = useState(true);

  // Re-fetch when filters change
  useEffect(() => {
    let isMounted = true;
    
    const fetchFirstPage = async () => {
      setIsLoadingServer(true);
      try {
        const { getDocs, query, collection, where, limit, orderBy } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        let constraints: any[] = [];
        const term = searchQuery.trim();
        
        if (term) {
           if (/^\\d+$/.test(term)) {
              constraints.push(where('nik', '>=', term));
              constraints.push(where('nik', '<=', term + '\\uf8ff'));
              constraints.push(orderBy('nik', 'asc'));
           } else {
              const capitalizedTerm = term.replace(/\\b\\w/g, c => c.toUpperCase());
              constraints.push(where('namaLengkap', '>=', capitalizedTerm));
              constraints.push(where('namaLengkap', '<=', capitalizedTerm + '\\uf8ff'));
              constraints.push(orderBy('namaLengkap', 'asc'));
           }
        } else {
           if (selectedStatus === 'Aktif') {
              constraints.push(where('statusKeanggotaan', '==', 'Aktif'));
           } else if (selectedStatus === 'Tidak Aktif') {
              constraints.push(where('statusKeanggotaan', 'in', ['Tidak Aktif', 'Non-Aktif']));
           }
           if (selectedDept !== 'All') {
              constraints.push(where('departemen', '==', selectedDept));
           }
        }
        
        constraints.push(limit(100)); // Fetch 100 at a time
        
        const q = query(collection(db, 'members'), ...constraints);
        const snap = await getDocs(q);
        
        if (isMounted) {
          const newMembers = snap.docs.map(d => ({ ...d.data(), id: d.id } as Member));
          
          // Client-side apply filters if search was used (since search ignores other filters to avoid composite indexes)
          let finalMembers = newMembers;
          if (term) {
            finalMembers = newMembers.filter(m => {
              const matchDept = selectedDept === 'All' || m.departemen === selectedDept;
              const isMemberInactive = m.statusKeanggotaan === 'Tidak Aktif' || m.statusKeanggotaan === 'Non-Aktif' || m.isMissingFromExcel === true;
              const matchStatus = 
                selectedStatus === 'All' ? true :
                selectedStatus === 'Aktif' ? (m.statusKeanggotaan === 'Aktif' && !m.isMissingFromExcel) :
                selectedStatus === 'Tidak Aktif' ? isMemberInactive : true;
              return matchDept && matchStatus;
            });
          }

          setServerMembers(finalMembers);
          setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
          setHasMoreServer(snap.docs.length === 100);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
      } finally {
        if (isMounted) setIsLoadingServer(false);
      }
    };
    
    // Debounce initial fetch if searching
    const timer = setTimeout(() => {
      fetchFirstPage();
    }, 500);
    
    return () => { isMounted = false; clearTimeout(timer); };
  }, [searchQuery, selectedDept, selectedStatus]);

  const loadMoreMembers = async () => {
    if (!lastDoc || !hasMoreServer || isLoadingServer) return;
    setIsLoadingServer(true);
    try {
        const { getDocs, query, collection, where, limit, startAfter, orderBy } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        let constraints: any[] = [];
        const term = searchQuery.trim();
        
        if (term) {
           if (/^\\d+$/.test(term)) {
              constraints.push(where('nik', '>=', term));
              constraints.push(where('nik', '<=', term + '\\uf8ff'));
              constraints.push(orderBy('nik', 'asc'));
           } else {
              const capitalizedTerm = term.replace(/\\b\\w/g, c => c.toUpperCase());
              constraints.push(where('namaLengkap', '>=', capitalizedTerm));
              constraints.push(where('namaLengkap', '<=', capitalizedTerm + '\\uf8ff'));
              constraints.push(orderBy('namaLengkap', 'asc'));
           }
        } else {
           if (selectedStatus === 'Aktif') {
              constraints.push(where('statusKeanggotaan', '==', 'Aktif'));
           } else if (selectedStatus === 'Tidak Aktif') {
              constraints.push(where('statusKeanggotaan', 'in', ['Tidak Aktif', 'Non-Aktif']));
           }
           if (selectedDept !== 'All') {
              constraints.push(where('departemen', '==', selectedDept));
           }
        }
        
        constraints.push(startAfter(lastDoc));
        constraints.push(limit(100));
        
        const q = query(collection(db, 'members'), ...constraints);
        const snap = await getDocs(q);
        
        const newMembers = snap.docs.map(d => ({ ...d.data(), id: d.id } as Member));
        let finalMembers = newMembers;
        if (term) {
          finalMembers = newMembers.filter(m => {
            const matchDept = selectedDept === 'All' || m.departemen === selectedDept;
            const isMemberInactive = m.statusKeanggotaan === 'Tidak Aktif' || m.statusKeanggotaan === 'Non-Aktif' || m.isMissingFromExcel === true;
            const matchStatus = 
              selectedStatus === 'All' ? true :
              selectedStatus === 'Aktif' ? (m.statusKeanggotaan === 'Aktif' && !m.isMissingFromExcel) :
              selectedStatus === 'Tidak Aktif' ? isMemberInactive : true;
            return matchDept && matchStatus;
          });
        }

        setServerMembers(prev => [...prev, ...finalMembers]);
        setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
        setHasMoreServer(snap.docs.length === 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingServer(false);
    }
  };

  // Filtered Members (now just the serverMembers array)
  const filteredMembers = serverMembers;

  // Paginated Members
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize) + (hasMoreServer ? 1 : 0));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMembers = useMemo(() => {
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, startIndex, pageSize]);

  // Load more when reaching near the end
  useEffect(() => {
    if (currentPage * pageSize >= filteredMembers.length && hasMoreServer) {
      loadMoreMembers();
    }
  }, [currentPage, pageSize, filteredMembers.length, hasMoreServer]);
`;

// we need to replace the useEffect for setCurrentPage(1), filteredMembers, and paginatedMembers
const targetRegex = /useEffect\(\(\) => \{\s*setCurrentPage\(1\);\s*\}, \[searchQuery, selectedDept, selectedStatus, pageSize\]\);\s*\/\/ Filtered Members[\s\S]*?\/\/ Paginated Members[\s\S]*?\}, \[filteredMembers, startIndex, pageSize\]\);/m;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement.trim());
  fs.writeFileSync('src/components/MembersModule.tsx', content);
  console.log("Successfully replaced pagination logic");
} else {
  console.log("Could not find the target text to replace.");
}
