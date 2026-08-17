import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, User, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Member } from '../types';
import { getDocs, query, collection, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MemberSearchSelectProps {
  members?: Member[];
  selectedMemberId: string;
  onSelectMember: (member: Member | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const MemberSearchSelect: React.FC<MemberSearchSelectProps> = ({
  members = [],
  selectedMemberId,
  onSelectMember,
  label = "Pilih Anggota dari Database",
  placeholder = "Ketik NIK atau Nama untuk mencari...",
  required = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelectedMember, setLocalSelectedMember] = useState<Member | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initially selected member
  useEffect(() => {
    if (!selectedMemberId) {
      setLocalSelectedMember(null);
      return;
    }
    const fetchSelected = async () => {
      try {
        const q = query(collection(db, 'members'), where('id', '==', selectedMemberId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLocalSelectedMember(snap.docs[0].data() as Member);
        }
      } catch (e) {
        console.warn('Failed to load selected member', e);
      }
    };
    fetchSelected();
  }, [selectedMemberId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        let q;
        const term = searchTerm.trim();
        
        if (!term) {
          q = query(collection(db, 'members'), limit(20));
        } else if (/^\d+$/.test(term)) {
          q = query(collection(db, 'members'), where('nik', '>=', term), where('nik', '<=', term + '\uf8ff'), limit(20));
        } else {
          const capitalizedTerm = term.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          q = query(collection(db, 'members'), where('namaLengkap', '>=', capitalizedTerm), where('namaLengkap', '<=', capitalizedTerm + '\uf8ff'), limit(20));
        }
        
        const snap = await getDocs(q);
        setSearchResults(snap.docs.map(doc => doc.data() as Member));
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isOpen]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs text-slate-300 font-semibold flex items-center justify-between">
          <span>{label} {required && <span className="text-red-400">*</span>}</span>
        </label>
      )}

      {localSelectedMember ? (
        /* Selected Member Card View */
        <div className="p-3 bg-slate-950 border border-emerald-700/60 rounded-xl flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white truncate">{localSelectedMember.namaLengkap}</span>
                <span className="px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 rounded font-mono text-[10px] shrink-0">
                  {localSelectedMember.nik}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {localSelectedMember.departemen} • {localSelectedMember.bagian || 'Line'} • No: {localSelectedMember.nomorAnggota}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectMember(null);
              setLocalSelectedMember(null);
              setSearchTerm('');
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0 ml-2"
            title="Ganti Anggota"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Ganti</span>
          </button>
        </div>
      ) : (
        /* Search Field & Dropdown Popup */
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800">
              <div className="p-2 bg-slate-950 text-[10px] text-slate-400 font-semibold sticky top-0 flex justify-between items-center border-b border-slate-800">
                <span>Pencarian: "{searchTerm || 'Semua'}"</span>
                <span>{isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Menampilkan max 20 hasil'}</span>
              </div>
              
              {!isLoading && searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Tidak ada anggota yang ditemukan.
                </div>
              ) : (
                searchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMember(m);
                      setLocalSelectedMember(m);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white group-hover:text-red-400 transition-colors truncate">
                          {m.namaLengkap}
                        </span>
                        <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono text-[10px] shrink-0 border border-slate-700">
                          {m.nik}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {m.departemen} ({m.bagian || 'Line'}) • HP: {m.nomorHp}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                      Pilih
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
