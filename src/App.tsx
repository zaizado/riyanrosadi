import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, QrCode, X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MembersModule } from './components/MembersModule';
import { AdvocacyModule } from './components/AdvocacyModule';
import { SickVisitModule } from './components/SickVisitModule';
import { AgendaModule } from './components/AgendaModule';
import { SembakoModule } from './components/SembakoModule';
import { VehicleManager } from './components/VehicleManager';
import { FinanceModule, parseRupiahNum } from './components/FinanceModule';
import { UserManagementModule } from './components/UserManagementModule';
import { SuperAdminModule } from './components/SuperAdminModule';
import { StructureModule } from './components/StructureModule';
import { ProfileModule } from './components/ProfileModule';
import { InformationModule } from './components/InformationModule';
import { FundraisingModule } from './components/FundraisingModule';
import { SeveranceModule } from './components/SeveranceCalculator/SeveranceModule';
import { MemberIdCardModal } from './components/MemberIdCardModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginModal } from './components/LoginModal';
import { PkbModal } from './components/PkbModal';
import { ModalPortal } from './components/ModalPortal';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import { playNotificationSound } from './lib/audio';
import cheAvatar from './assets/images/pengurus_che_avatar_1785341733072.jpg';
import { compressImage } from './lib/imageUtils';
import { STRUKTUR_PENGURUS_DATA } from './data/strukturPengurusData';

import { 
  UserAccount, 
  Member, 
  AdvocacyCase, 
  SickVisit, 
  OrganizationAgenda, 
  SembakoEvent, 
  SembakoClaim, 
  AuditLog,
  VehicleLog,
  FinanceDailyRecord,
  FundraisingCampaign,
  checkIsSuperAdmin
} from './types';

import { AppService } from './services/appService';
import { AuditService } from './services/auditService';
import { 
  generateNotificationId, 
  extractEntityId, 
  NotificationTracker, 
  deduplicateNotifications 
} from './lib/notificationIdempotency';
import { useAppData } from './hooks/useAppData';
import {
  getCurrentUser,
  setCurrentUser,
  sortAuditLogsNewestFirst,
  resetAllData 
} from './lib/storage';

import {
  subscribeCollection,
  subscribeDocument,
  saveFirestoreDoc,
  saveFullCollection,
  deleteFirestoreDoc
} from './lib/firebase';

import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { AuthState, resolveUserProfile } from './lib/authSession';

export default function App() {
  const [currentUser, setCurrentUserAccount] = useState<UserAccount>(() => getCurrentUser());
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // State Initialization from Firestore via Hook (role-aware finance subscription)
  const {
    members, setMembers,
    advocacyCases, setAdvocacyCases,
    sickVisits, setSickVisits,
    agendas, setAgendas,
    sembakoEvents, setSembakoEvents,
    sembakoClaims, setSembakoClaims,
    vehicleLogs, setVehicleLogs,
    financeRecords, setFinanceRecords,
    auditLogs, setAuditLogs,
    fundraisingCampaigns, setFundraisingCampaigns,
    users, setUsers,
    severanceCalculations,
    pkbRules,
    notulensiFiles, setNotulensiFiles,
    isSyncOffline,
    syncState
  } = useAppData(currentUser);

  const usersRef = React.useRef(users);
  usersRef.current = users;

  // Subscribe to Firebase Authentication state - single subscription on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { matchedUser } = resolveUserProfile({
          firebaseUser,
          users: usersRef.current,
          cachedUser: getCurrentUser()
        });

        if (matchedUser) {
          setIsLoggedIn(true);
          setCurrentUserAccount(matchedUser);
          setCurrentUser(matchedUser);
          const userDocToSave: UserAccount = {
            ...matchedUser,
            id: firebaseUser.uid
          };
          saveFirestoreDoc('users', userDocToSave).catch(err => console.warn('Could not auto-save user profile to firestore', err));
          setAuthState('authenticated');
        } else {
          console.warn('onAuthStateChanged: Authenticated Firebase user has no matched authorization profile:', firebaseUser.email);
          setAuthState('unauthenticated');
          setIsLoggedIn(false);
        }
      } else {
        setAuthState('unauthenticated');
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserAccount(user);
    setCurrentUser(user);
    setAuthState('authenticated');
    setIsLoggedIn(true);
    playNotificationSound();
    createLog('Sistem', 'Login', `Pengurus ${user.name} (${user.role}) berhasil masuk ke sistem`);
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setAuthState('unauthenticated');
    setIsLoggedIn(false);
    playNotificationSound();
  };

  // Presence heartbeat: Ping current user's lastActive timestamp every 60s without overwriting profile fields
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    const pingPresence = async () => {
      const nowIso = new Date().toISOString();
      try {
        await saveFirestoreDoc('users', { id: currentUser.id, lastActive: nowIso });
      } catch (e) {
        // Silently handle offline
      }
    };

    pingPresence();
    const presenceInterval = setInterval(pingPresence, 60000);

    return () => clearInterval(presenceInterval);
  }, [isLoggedIn, currentUser?.id]);

  // Realtime Sync: Keep active currentUser state in sync with Firestore users collection and Firebase Auth
  useEffect(() => {
    const fbUser = auth.currentUser;
    if (fbUser && users && users.length > 0) {
      const { matchedUser } = resolveUserProfile({
        firebaseUser: fbUser,
        users,
        cachedUser: currentUser
      });

      if (matchedUser) {
        setIsLoggedIn(true);
        setAuthState('authenticated');
        setCurrentUserAccount(matchedUser);
        setCurrentUser(matchedUser);
      }
    } else if (isLoggedIn && currentUser?.id && users && users.length > 0) {
      const freshUser = users.find(u => 
        u.id === currentUser.id || 
        (u.username && currentUser.username && u.username.toLowerCase() === currentUser.username.toLowerCase()) ||
        (u.nik && currentUser.nik && u.nik.trim().toLowerCase() === currentUser.nik.trim().toLowerCase())
      );
      if (freshUser) {
        const hasProfileChanged = 
          freshUser.avatarUrl !== currentUser.avatarUrl ||
          freshUser.phoneNumber !== currentUser.phoneNumber ||
          freshUser.email !== currentUser.email ||
          freshUser.name !== currentUser.name ||
          freshUser.role !== currentUser.role ||
          freshUser.department !== currentUser.department;

        if (hasProfileChanged) {
          setCurrentUserAccount(freshUser);
          setCurrentUser(freshUser);
        }
      }
    }
  }, [users]);

// Ensure default light theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [draftVehicleRequest, setDraftVehicleRequest] = useState<Partial<VehicleLog> | null>(null);

  const handleNavigateToVehicleRequest = (draft?: Partial<VehicleLog>) => {
    if (draft) {
      setDraftVehicleRequest(draft);
    }
    setActiveTab('vehicles');
  };

// Auto scroll to top when changing active menu/tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

// Modals state
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isPkbModalOpen, setIsPkbModalOpen] = useState(false);

// Helper to log audit with sound tone and deterministic idempotency
  const createLog = async (
    modul: AuditLog['modul'], 
    aksi: string, 
    detail: string,
    entityId?: string,
    idempotencyKey?: string
  ) => {
    const isSuper = checkIsSuperAdmin(currentUser);
    const determinedId = idempotencyKey || generateNotificationId({
      modul,
      entityId: entityId || extractEntityId(detail, modul),
      action: aksi,
      userId: auth.currentUser?.uid || currentUser.id
    });

    // Avoid double playing audio notification if the exact same event was just processed
    if (!NotificationTracker.hasRecentlyProcessed(determinedId)) {
      // Notifikasi & suara untuk Keuangan hanya aktif untuk Super Admin
      if (modul !== 'Keuangan' || isSuper) {
        playNotificationSound();
      }
    }

    try {
      await AuditService.createLog(
        currentUser.name, 
        currentUser.role, 
        modul, 
        aksi, 
        detail, 
        undefined, 
        entityId, 
        determinedId
      );
    } catch (err) {
      console.error('App.tsx: Gagal mencatat audit log ke Firestore:', err);
    }
  };

  // Helper to derive stable personal user key for notification tracking based on Firebase Auth UID (PATCH 8)
  const getUserNotifKey = (user?: UserAccount | null): string => {
    const authUid = auth.currentUser?.uid;
    if (authUid) return authUid;
    if (isLoggedIn && user?.id) return user.id;
    return '';
  };

  const userNotifKey = getUserNotifKey(currentUser);

  // Track cleared notification IDs per user account (stored locally & synced to Firestore doc per user)
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>(() => {
    if (!userNotifKey) return [];
    try {
      const stored = localStorage.getItem(`sbn_cleared_notifs_${userNotifKey}`);
      if (stored) return JSON.parse(stored);
      if (currentUser?.username) {
        const legacyKey = currentUser.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const legacyStored = localStorage.getItem(`sbn_cleared_notifs_${legacyKey}`);
        if (legacyStored) return JSON.parse(legacyStored);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Re-sync cleared notifications when active user account changes or Firestore updates
  useEffect(() => {
    const authUid = auth.currentUser?.uid;
    if (!isLoggedIn || !authUid) {
      setClearedNotifIds([]);
      return;
    }

    // 1. Load from localStorage with backward-compatible fallback
    let localCleared: string[] = [];
    try {
      const stored = localStorage.getItem(`sbn_cleared_notifs_${authUid}`);
      if (stored) {
        localCleared = JSON.parse(stored);
      } else if (currentUser?.username) {
        const legacyKey = currentUser.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const legacyStored = localStorage.getItem(`sbn_cleared_notifs_${legacyKey}`);
        if (legacyStored) {
          localCleared = JSON.parse(legacyStored);
          localStorage.setItem(`sbn_cleared_notifs_${authUid}`, legacyStored);
        }
      }
    } catch {
      localCleared = [];
    }
    setClearedNotifIds(localCleared);

    // 2. Realtime sync with Firestore userClearedNotifs document based on UID
    const unsub = subscribeDocument<{ id: string; clearedIds?: string[] }>('userClearedNotifs', authUid, (userDoc) => {
      if (userDoc && Array.isArray(userDoc.clearedIds)) {
        const merged = Array.from(new Set([...localCleared, ...userDoc.clearedIds]));
        setClearedNotifIds(merged);
        try {
          localStorage.setItem(`sbn_cleared_notifs_${authUid}`, JSON.stringify(merged));
        } catch {
        }
      }
    });

    return () => unsub();
  }, [isLoggedIn, currentUser?.id]);

// Active notifications for current user account with idempotency deduplication
  const isSuperAdminUser = checkIsSuperAdmin(currentUser);
  const clearedSet = new Set(clearedNotifIds);
  const activeNotifications = sortAuditLogsNewestFirst(deduplicateNotifications(auditLogs).filter(log => {
    if (!log.id || clearedSet.has(log.id)) return false;
// Notifikasi keuangan (divisi dana dan usaha) hanya untuk Super Admin
    if (!isSuperAdminUser && log.modul === 'Keuangan') return false;
    return true;
  }));

// Delete a single notification for current user account
  const handleDeleteSingleNotification = async (logId: string) => {
    if (!logId) return;
    const updated = Array.from(new Set([...clearedNotifIds, logId]));
    try {
      await AppService.updateUserClearedNotifs(userNotifKey, updated);
      setClearedNotifIds(updated);
      localStorage.setItem(`sbn_cleared_notifs_${userNotifKey}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to store single cleared notification:', err);
    }
  };

// Clear all active notifications for current user account
  const handleClearNotifications = async () => {
    const currentIds = activeNotifications.map(l => l.id).filter(Boolean) as string[];
    const updated = Array.from(new Set([...clearedNotifIds, ...currentIds]));
    try {
      await AppService.updateUserClearedNotifs(userNotifKey, updated);
      setClearedNotifIds(updated);
      localStorage.setItem(`sbn_cleared_notifs_${userNotifKey}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to store cleared notifications:', err);
    }
  };

// Switch Active Role User
  const handleSwitchUser = (newUser: UserAccount) => {
    setCurrentUserAccount(newUser);
    setCurrentUser(newUser);
  };

  // Real-time synchronization of active currentUser account when Firestore users updates
  useEffect(() => {
    if (!currentUser?.id || !users || users.length === 0) return;
    const matchedUser = users.find(u => u.id === currentUser.id || (u.nik && currentUser.nik && u.nik.trim().toLowerCase() === currentUser.nik.trim().toLowerCase()));
    if (matchedUser) {
      if (
        matchedUser.avatarUrl !== currentUser.avatarUrl ||
        matchedUser.phoneNumber !== currentUser.phoneNumber ||
        matchedUser.email !== currentUser.email ||
        matchedUser.role !== currentUser.role ||
        matchedUser.name !== currentUser.name ||
        matchedUser.department !== currentUser.department
      ) {
        setCurrentUserAccount(matchedUser);
        setCurrentUser(matchedUser);
      }
    }
  }, [users]);

// MEMBERS HANDLERS
  const handleAddMember = async (newMbr: Member) => {
    await AppService.addMember(newMbr);
    setMembers(prev => [newMbr, ...prev.filter(m => m.id !== newMbr.id)]);
    await createLog('Data Anggota', 'Tambah Anggota Baru', `Menambahkan anggota ${newMbr.namaLengkap} (${newMbr.nomorAnggota}) Dept ${newMbr.departemen}.`, newMbr.id);
  };

  const handleUpdateMember = async (updatedMbr: Member) => {
    await AppService.updateMember(updatedMbr);
    setMembers(prev => prev.map(m => m.id === updatedMbr.id ? updatedMbr : m));

    // Sync member photo/email/phone to matching user if NIK matches
    if (updatedMbr.nik) {
      const cleanMemberNik = updatedMbr.nik.trim().toLowerCase().replace(/^0+/, '');
      const matchingUser = users.find(u => {
        if (!u.nik) return false;
        const cleanUserNik = u.nik.trim().toLowerCase().replace(/^0+/, '');
        return cleanUserNik === cleanMemberNik;
      });

      if (matchingUser) {
        const updatedUser: UserAccount = {
          ...matchingUser,
          ...(updatedMbr.fotoUrl ? { avatarUrl: updatedMbr.fotoUrl } : {}),
          ...(updatedMbr.nomorHp ? { phoneNumber: updatedMbr.nomorHp } : {}),
          ...(updatedMbr.email ? { email: updatedMbr.email } : {})
        };
        await AppService.addUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser.id === updatedUser.id) {
          setCurrentUserAccount(updatedUser);
          setCurrentUser(updatedUser);
        }
      }
    }

    await createLog('Data Anggota', 'Update Data Anggota', `Memperbarui biodata ${updatedMbr.namaLengkap} (${updatedMbr.nomorAnggota}).`, updatedMbr.id);
  };

  const handleDeleteMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    await AppService.deleteMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
    if (target) {
      await createLog('Data Anggota', 'Hapus Anggota', `Menghapus data anggota ${target.namaLengkap} (${target.nomorAnggota}).`, memberId);
    }
  };

  const handleImportMembers = async (importedMembers: Member[]) => {
    await AppService.saveAllMembers(importedMembers);
    setMembers(importedMembers);
    await createLog('Data Anggota', 'Import Spreadsheet Data Anggota', `Berhasil melakukan impor/sinkronisasi ${importedMembers.length} data anggota dari Excel/CSV.`, `batch_${importedMembers.length}`);
  };

// ADVOCACY HANDLERS
  const handleAddAdvocacyCase = async (newCase: AdvocacyCase) => {
    await AppService.addAdvocacy(newCase);
    setAdvocacyCases(prev => [newCase, ...prev.filter(c => c.id !== newCase.id)]);
    await createLog('Advokasi', 'Buat Kasus Advokasi Baru', `Dibuat kasus ${newCase.nomorKasus} - ${newCase.judulKasus} untuk ${newCase.namaAnggota}.`, newCase.id);
  };

  const handleUpdateAdvocacyCase = async (updatedCase: AdvocacyCase) => {
    await AppService.updateAdvocacy(updatedCase);
    setAdvocacyCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    await createLog('Advokasi', 'Update Status Advokasi', `Memperbarui status kasus ${updatedCase.nomorKasus} menjadi ${updatedCase.status}.`, `${updatedCase.id}_${updatedCase.status}`);
  };

  const handleDeleteAdvocacyCase = async (caseId: string) => {
    const target = advocacyCases.find(c => c.id === caseId);
    await AppService.deleteAdvocacy(caseId);
    setAdvocacyCases(prev => prev.filter(c => c.id !== caseId));
    if (target) {
      await createLog('Advokasi', 'Hapus Kasus Advokasi', `Menghapus kasus advokasi ${target.nomorKasus} (${target.judulKasus}).`, caseId);
    }
  };

// SICK VISIT HANDLERS
  const handleAddSickVisit = async (newVisit: SickVisit) => {
    await AppService.addSickVisit(newVisit);
    setSickVisits(prev => [newVisit, ...prev.filter(v => v.id !== newVisit.id)]);
    await createLog('Anggota Sakit', 'Catat Pendampingan Sakit', `Pencatatan pendampingan sakit ${newVisit.nomorPendampingan} untuk ${newVisit.namaAnggota} di ${newVisit.lokasi}.`, newVisit.id);
  };

  const handleUpdateSickVisit = async (updatedVisit: SickVisit, actionName?: string, auditDetail?: string) => {
    await AppService.updateSickVisit(updatedVisit);
    setSickVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    await createLog(
      'Anggota Sakit', 
      actionName || 'Update Pendampingan SOP', 
      auditDetail || `Memperbarui status/data pendampingan ${updatedVisit.nomorPendampingan} (${updatedVisit.namaAnggota}). Status: ${updatedVisit.status}`,
      `${updatedVisit.id}_${updatedVisit.status}`
    );
  };

  const handleDeleteSickVisit = async (visitId: string) => {
    const target = sickVisits.find(v => v.id === visitId);
    await AppService.deleteSickVisit(visitId);
    setSickVisits(prev => prev.filter(v => v.id !== visitId));
    if (target) {
      await createLog('Anggota Sakit', 'Hapus Data Visite Sakit', `Menghapus data pendampingan sakit ${target.nomorPendampingan} (${target.namaAnggota}).`, visitId);
    }
  };

// AGENDA HANDLERS
  const handleAddAgenda = async (newAgd: OrganizationAgenda) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    await AppService.addAgenda(newAgd);
    setAgendas(prev => [newAgd, ...prev.filter(a => a.id !== newAgd.id)]);
    await createLog('Agenda', 'Tambah Agenda Kegiatan', `Menambahkan agenda baru: ${newAgd.judul} (${newAgd.jenis}) pada ${newAgd.tanggalWaktu}.`, newAgd.id);
  };

  const handleUpdateAgenda = async (updatedAgd: OrganizationAgenda) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    await AppService.updateAgenda(updatedAgd);
    setAgendas(prev => prev.map(a => a.id === updatedAgd.id ? updatedAgd : a));
    await createLog('Agenda', 'Update Agenda Kegiatan', `Memperbarui detail agenda ${updatedAgd.judul}.`, `${updatedAgd.id}_${updatedAgd.status || 'updated'}`);
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    const target = agendas.find(a => a.id === agendaId);
    await AppService.deleteAgenda(agendaId);
    setAgendas(prev => prev.filter(a => a.id !== agendaId));
    if (target) {
      await createLog('Agenda', 'Hapus Agenda Kegiatan', `Menghapus agenda ${target.judul}.`, agendaId);
    }
  };

// FUNDRAISING HANDLERS
  const handleAddFundraisingCampaign = async (newCamp: FundraisingCampaign) => {
    await AppService.addFundraising(newCamp);
    setFundraisingCampaigns(prev => [newCamp, ...prev.filter(c => c.id !== newCamp.id)]);
    await createLog(
      'Penggalangan Dana',
      'Buat Penggalangan Dana Baru',
      `Membuat penggalangan dana ${newCamp.nomorPenggalangan} untuk ${newCamp.namaAnggota} (${newCamp.nikAnggota}) - Hubungan: ${newCamp.hubungan}, Kondisi: ${newCamp.kondisi}.`,
      newCamp.id
    );
  };

  const handleUpdateFundraisingCampaign = async (updatedCamp: FundraisingCampaign) => {
    await AppService.updateFundraising(updatedCamp);
    setFundraisingCampaigns(prev => prev.map(c => c.id === updatedCamp.id ? updatedCamp : c));
    await createLog(
      'Penggalangan Dana',
      'Update Penggalangan Dana',
      `Memperbarui penggalangan dana ${updatedCamp.nomorPenggalangan} (${updatedCamp.namaAnggota}) - Dana Terkumpul: Rp ${updatedCamp.jumlahTerkumpul.toLocaleString('id-ID')}.`,
      `${updatedCamp.id}_${updatedCamp.status || 'updated'}`
    );
  };

  const handleDeleteFundraisingCampaign = async (id: string) => {
    const target = fundraisingCampaigns.find(c => c.id === id);
    await AppService.deleteFundraising(id);
    setFundraisingCampaigns(prev => prev.filter(c => c.id !== id));
    if (target) {
      await createLog(
        'Penggalangan Dana',
        'Hapus Penggalangan Dana',
        `Menghapus penggalangan dana ${target.nomorPenggalangan} untuk ${target.namaAnggota}.`,
        id
      );
    }
  };

// SEMBAKO HANDLERS
  const handleAddSembakoEvent = async (newEvent: SembakoEvent, initialClaims: SembakoClaim[]) => {
    await AppService.addSembakoEvent(newEvent);
    if (initialClaims.length > 0) {
      await AppService.saveAllSembakoClaims(initialClaims);
    }
    setSembakoEvents(prev => [newEvent, ...prev.filter(e => e.id !== newEvent.id)]);
    setSembakoClaims(prev => [...initialClaims, ...prev.filter(c => c.eventId !== newEvent.id)]);
    await createLog('Sembako', 'Buat Event Sembako Baru', `Membuat event ${newEvent.namaEvent} untuk ${newEvent.totalPenerima} anggota aktif.`, newEvent.id);
  };

  const handleUpdateSembakoClaim = async (updatedClaim: SembakoClaim) => {
    await AppService.updateSembakoClaim(updatedClaim);
    setSembakoClaims(prev => prev.map(c => c.id === updatedClaim.id ? updatedClaim : c));

    // Update event counter in Firestore
    const eventObj = sembakoEvents.find(e => e.id === updatedClaim.eventId);
    if (eventObj) {
      const allCurrentClaims = sembakoClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c);
      const totalClaimed = allCurrentClaims.filter(c => c.eventId === eventObj.id && c.status === 'Sudah Ambil').length;
      const updatedEvent: SembakoEvent = { ...eventObj, totalSudahAmbil: totalClaimed };
      await AppService.updateSembakoEvent(updatedEvent);
      setSembakoEvents(prev => prev.map(e => e.id === eventObj.id ? updatedEvent : e));
    }

    await createLog('Sembako', 'Update Klaim Sembako', `Pembaruan klaim sembako untuk ${updatedClaim.namaLengkap} (${updatedClaim.nomorAnggota}) status: ${updatedClaim.status}.`, `${updatedClaim.id}_${updatedClaim.status}`);
  };

  const handleDeleteSembakoEvent = async (eventId: string) => {
    const eventToDelete = sembakoEvents.find(e => e.id === eventId);
    const claimsToDelete = sembakoClaims.filter(c => c.eventId === eventId);
    
    await AppService.deleteSembakoEvent(eventId);
    for (const claim of claimsToDelete) {
      await deleteFirestoreDoc('sembakoClaims', claim.id);
    }

    setSembakoEvents(prev => prev.filter(e => e.id !== eventId));
    setSembakoClaims(prev => prev.filter(c => c.eventId !== eventId));

    await createLog('Sembako', 'Hapus Event Sembako', `Menghapus event sembako "${eventToDelete?.namaEvent || eventId}" beserta seluruh data klaim anggotanya`, eventId);
  };

  const handleDeleteSembakoClaim = async (claimId: string) => {
    const target = sembakoClaims.find(c => c.id === claimId);
    await deleteFirestoreDoc('sembakoClaims', claimId);
    setSembakoClaims(prev => prev.filter(c => c.id !== claimId));

    if (target) {
      const eventObj = sembakoEvents.find(e => e.id === target.eventId);
      if (eventObj) {
        const remaining = sembakoClaims.filter(c => c.eventId === eventObj.id && c.id !== claimId);
        const totalSudah = remaining.filter(c => c.status === 'Sudah Ambil').length;
        const updatedEv: SembakoEvent = {
          ...eventObj,
          totalPenerima: remaining.length,
          totalSudahAmbil: totalSudah,
        };
        await AppService.updateSembakoEvent(updatedEv);
        setSembakoEvents(prev => prev.map(e => e.id === eventObj.id ? updatedEv : e));
      }
      await createLog('Sembako', 'Hapus Klaim Sembako', `Menghapus data sembako penerima ${target.namaLengkap} (${target.nomorAnggota}).`, claimId);
    }
  };

  // VEHICLE HANDLERS
  const handleAddVehicleLog = async (newLog: VehicleLog) => {
    await AppService.addVehicleLog(newLog);
    setVehicleLogs(prev => [newLog, ...prev.filter(v => v.id !== newLog.id)]);
    await createLog('Kendaraan', 'Catat Pemakaian Kendaraan', `Mencatat jurnal ${newLog.nomorLog} untuk ${newLog.kendaraan} (${newLog.platNomor}) oleh ${newLog.namaPemakai}.`, newLog.id);

    // Auto-link with SickVisit if this vehicle request belongs to a sick visit
    if (newLog.sickVisitId) {
      const targetVisit = sickVisits.find(v => v.id === newLog.sickVisitId);
      if (targetVisit) {
        const updatedVisit: SickVisit = {
          ...targetVisit,
          butuhKendaraan: true,
          vehicleLogId: newLog.id,
          nomorLogKendaraan: newLog.nomorLog,
          updatedAt: new Date().toISOString(),
        };
        await AppService.updateSickVisit(updatedVisit);
        setSickVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
      }
    }
  };

  const handleUpdateVehicleLog = async (updatedLog: VehicleLog) => {
    await AppService.updateVehicleLog(updatedLog);
    setVehicleLogs(prev => prev.map(v => v.id === updatedLog.id ? updatedLog : v));
    await createLog('Kendaraan', 'Update Pemakaian Kendaraan', `Memperbarui jurnal ${updatedLog.nomorLog} (${updatedLog.kendaraan}) status: ${updatedLog.status}.`, `${updatedLog.id}_${updatedLog.status}`);
  };

  const handleDeleteVehicleLog = async (id: string) => {
    const target = vehicleLogs.find(v => v.id === id);
    await AppService.deleteVehicleLog(id);
    setVehicleLogs(prev => prev.filter(v => v.id !== id));
    if (target) {
      await createLog('Kendaraan', 'Hapus Jurnal Kendaraan', `Menghapus jurnal ${target.nomorLog} (${target.kendaraan}).`, id);
    }
  };

  // FINANCE HANDLERS
  const handleSaveFinanceRecord = async (newOrUpdated: FinanceDailyRecord) => {
    const cleanRecord: FinanceDailyRecord = {
      ...newOrUpdated,
      saldoAwal: parseRupiahNum(newOrUpdated.saldoAwal),
      uangCosMasuk: parseRupiahNum(newOrUpdated.uangCosMasuk),
      pengeluaranItems: (newOrUpdated.pengeluaranItems || []).map(item => ({
        ...item,
        nominal: parseRupiahNum(item.nominal)
      }))
    };

    await AppService.addFinanceRecord(cleanRecord);
    setFinanceRecords(prev => {
      const existingIdx = prev.findIndex(f => f.id === cleanRecord.id || f.tanggal === cleanRecord.tanggal);
      if (existingIdx >= 0) {
        const updatedList = [...prev];
        updatedList[existingIdx] = cleanRecord;
        return updatedList;
      }
      return [cleanRecord, ...prev];
    });
    await createLog('Keuangan', 'Update Kas Keuangan', `Catatan kas tanggal ${cleanRecord.tanggal}, COS Masuk: Rp ${cleanRecord.uangCosMasuk.toLocaleString('id-ID')}, Items Pengeluaran: ${cleanRecord.pengeluaranItems.length}.`, cleanRecord.id || cleanRecord.tanggal);
  };

  const handleDeleteFinanceRecord = async (id: string) => {
    const target = financeRecords.find(f => f.id === id);
    await AppService.deleteFinanceRecord(id);
    setFinanceRecords(prev => prev.filter(f => f.id !== id));
    if (target) {
      await createLog('Keuangan', 'Hapus Transaksi Kas', `Menghapus catatan kas tanggal ${target.tanggal}.`, id);
    }
  };

  // USER MANAGEMENT HANDLERS
  const handleAddUser = async (newUsr: UserAccount) => {
    let userToSave = newUsr;
    if (userToSave.avatarUrl && userToSave.avatarUrl.length > 80000 && userToSave.avatarUrl.startsWith('data:image')) {
      const compressed = await compressImage(userToSave.avatarUrl, 300, 300, 0.75);
      userToSave = { ...userToSave, avatarUrl: compressed };
    }
    
    // 1. Write to Firestore first to ensure persistence
    await AppService.addUser(userToSave);

    // 2. Functional state updater to prevent race conditions during bulk consecutive creations
    setUsers(prev => [userToSave, ...prev.filter(u => u.id !== userToSave.id)]);

    // 3. Write audit log
    await createLog('Sistem', 'Tambah User Pengurus', `Menambahkan akun pengurus baru ${userToSave.name} (${userToSave.role}).`, userToSave.id);
  };

  const handleUpdateUser = async (updatedUsr: UserAccount) => {
    let userToSave = updatedUsr;
    if (userToSave.avatarUrl && userToSave.avatarUrl.length > 80000 && userToSave.avatarUrl.startsWith('data:image')) {
      const compressed = await compressImage(userToSave.avatarUrl, 300, 300, 0.75);
      userToSave = { ...userToSave, avatarUrl: compressed };
    }

    // 1. Update in Firestore
    await AppService.updateUser(userToSave);

    // 2. Functional state updater
    setUsers(prev => prev.map(u => u.id === userToSave.id ? userToSave : u));

    if (currentUser.id === userToSave.id) {
      setCurrentUserAccount(userToSave);
      setCurrentUser(userToSave);
    }

    // Synchronize photo, email, and WhatsApp/phone update by NIK to Members in Firestore
    if (userToSave.nik) {
      const userNikClean = String(userToSave.nik).trim().toLowerCase().replace(/^0+/, '');

      const targetMember = members.find(m => {
        if (!m.nik) return false;
        const mNikClean = String(m.nik).trim().toLowerCase().replace(/^0+/, '');
        return mNikClean === userNikClean || String(m.nik).trim().toLowerCase() === String(userToSave.nik).trim().toLowerCase();
      });

      if (targetMember) {
        const updatedMember: Member = {
          ...targetMember,
          ...(userToSave.avatarUrl ? { fotoUrl: userToSave.avatarUrl } : {}),
          ...(userToSave.phoneNumber ? { nomorHp: userToSave.phoneNumber } : {}),
          ...(userToSave.email ? { email: userToSave.email } : {})
        };
        await AppService.updateMember(updatedMember);
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      }
    }

    await createLog('Sistem', 'Update Profil Pengguna', `Pengguna ${userToSave.name} (${userToSave.role}) memperbarui data profil akun (Email/WhatsApp/Foto).`, userToSave.id);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    await AppService.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (target) {
      await createLog('Sistem', 'Hapus Akun Pengurus', `Menghapus akun pengurus ${target.name} (@${target.username}).`, userId);
    }
  };

  const handleResetSystem = () => {
    resetAllData();
    window.location.reload();
  };

  // 1. Initializing state: Do NOT render Login or Dashboard, show clean loading state
  if (authState === 'initializing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <div className="text-sm font-medium text-slate-400 tracking-wide">Memeriksa sesi pengguna...</div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Enforce login screen
  if (authState === 'unauthenticated' || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex items-center justify-center">
        <LoginModal
          isOpen={true}
          users={users}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          isFullPage={true}
        />
      </div>
    );
  }

  return (
    <div className="app-shell bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white relative overflow-x-hidden">
      {/* Global Background Grid & Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.12),transparent_50%)] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none z-0" />
      
      {/* Top Fixed Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={activeNotifications.length}
        onLogout={handleLogout}
        syncState={syncState}
      />

      {/* Offline Sync Status Banner */}
      {syncState === 'offline' && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 text-rose-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 z-20 shadow-md">
          <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
          <span>🔴 OFFLINE — Menunggu koneksi internet. Data lokal tetap dapat diakses.</span>
        </div>
      )}
      {syncState === 'quota' && (
        <div className="bg-amber-950/95 border-b border-amber-500/50 text-amber-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 z-20 shadow-md">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>⚡ KUOTA FIRESTORE TERCAPAI (Quota Exceeded) — Aplikasi berjalan dalam mode data lokal (cache). Kuota akan otomatis di-reset besok.</span>
        </div>
      )}
      {syncState === 'error' && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 text-rose-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 z-20 shadow-md">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>⚠️ SINKRONISASI BERMASALAH — Memeriksa koneksi database Firestore.</span>
        </div>
      )}

      {/* Drawer Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenPkb={() => setIsPkbModalOpen(true)}
      />

      {/* Main Content Area (supports optional Android device frame mode) */}
      <main className={`flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden ${isMobilePreview ? "p-2 sm:p-4 pb-6" : "p-3 sm:p-6 lg:p-8 pb-8"}`}>
        <div className={isMobilePreview ? 'max-w-md mx-auto border-[6px] sm:border-[10px] border-slate-800 rounded-[32px] sm:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-900/90 p-3 sm:p-5 ring-1 ring-white/10 my-2 overflow-x-hidden backdrop-blur-xl' : 'w-full max-w-full lg:max-w-[1650px] mx-auto'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  members={members}
                  advocacyCases={advocacyCases}
                  sickVisits={sickVisits}
                  agendas={agendas}
                  sembakoEvents={sembakoEvents}
                  sembakoClaims={sembakoClaims}
                  vehicleLogs={vehicleLogs}
                  auditLogs={auditLogs}
                  financeRecords={financeRecords}
                  fundraisingCampaigns={fundraisingCampaigns}
                  currentUser={currentUser}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenNewCase={() => setActiveTab('advocacy')}
                  onOpenNewSickVisit={() => setActiveTab('sick_visits')}
                  onOpenNewAgenda={() => setActiveTab('agendas')}
                  onOpenScan={() => setIsScanModalOpen(true)}
                />
              )}

              {/* Menu 1: Data Anggota */}
              {activeTab === 'members' && (
                <MembersModule
                  members={members}
                  auditLogs={auditLogs}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  onImportMembers={handleImportMembers}
                  onOpenCardModal={(mbr) => setSelectedCardMember(mbr)}
                  currentUser={currentUser}
                />
              )}

              {/* Menu Struktur Pengurus (Point 10 requirement) */}
              {activeTab === 'structure' && (
                <StructureModule
                  users={users}
                  members={members}
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                  onUpdateMember={handleUpdateMember}
                  onNavigateToProfile={() => setActiveTab('profile')}
                />
              )}

              {/* Menu Profil Pengguna (Point 4 requirement) */}
              {activeTab === 'profile' && (
                <ProfileModule
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              )}

              {/* Menu 2: Advokasi */}
              {activeTab === 'advocacy' && (
                <AdvocacyModule
                  advocacyCases={advocacyCases}
                  members={members}
                  onAddCase={handleAddAdvocacyCase}
                  onUpdateCase={handleUpdateAdvocacyCase}
                  onDeleteCase={handleDeleteAdvocacyCase}
                  currentUser={currentUser}
                />
              )}

              {/* Menu Simulasi Pesangon */}
              {activeTab === 'severance' && (
                <SeveranceModule
                  members={members}
                  historyItems={severanceCalculations}
                  currentUser={currentUser}
                  pkbRules={pkbRules}
                />
              )}

              {/* Menu 3: Anggota Sakit */}
              {activeTab === 'sick_visits' && (
                <SickVisitModule
                  sickVisits={sickVisits}
                  members={members}
                  onAddVisit={handleAddSickVisit}
                  onUpdateVisit={handleUpdateSickVisit}
                  onDeleteVisit={handleDeleteSickVisit}
                  currentUser={currentUser}
                  onRequestVehicle={handleNavigateToVehicleRequest}
                />
              )}

              {/* Menu Penggalangan Dana */}
              {activeTab === 'fundraising' && (
                <FundraisingModule
                  campaigns={fundraisingCampaigns}
                  members={members}
                  sickVisits={sickVisits}
                  currentUser={currentUser}
                  onAddCampaign={handleAddFundraisingCampaign}
                  onUpdateCampaign={handleUpdateFundraisingCampaign}
                  onDeleteCampaign={handleDeleteFundraisingCampaign}
                />
              )}

              {/* Menu Informasi Agenda & Kegiatan Organisasi */}
              {activeTab === 'agendas' && (
                <AgendaModule
                  agendas={agendas}
                  notulensiFiles={notulensiFiles}
                  onAddAgenda={handleAddAgenda}
                  onUpdateAgenda={handleUpdateAgenda}
                  onDeleteAgenda={handleDeleteAgenda}
                  currentUser={currentUser}
                />
              )}

              {/* Menu 5: Sembako */}
              {activeTab === 'sembako' && (
                <SembakoModule
                  sembakoEvents={sembakoEvents}
                  sembakoClaims={sembakoClaims}
                  members={members}
                  onAddEvent={handleAddSembakoEvent}
                  onUpdateClaim={handleUpdateSembakoClaim}
                  onDeleteEvent={handleDeleteSembakoEvent}
                  onDeleteClaim={handleDeleteSembakoClaim}
                  currentUser={currentUser}
                />
              )}

              {/* Menu Kendaraan Operasional */}
              {activeTab === 'vehicles' && (
                <VehicleManager
                  vehicleLogs={vehicleLogs}
                  members={members}
                  users={users}
                  currentUser={currentUser}
                  draftRequest={draftVehicleRequest}
                  onClearDraftRequest={() => setDraftVehicleRequest(null)}
                  onAddLog={handleAddVehicleLog}
                  onUpdateLog={handleUpdateVehicleLog}
                  onDeleteLog={handleDeleteVehicleLog}
                />
              )}

              {/* Menu Divisi Dana Dan Keuangan (Super Admin Only) */}
              {activeTab === 'finance' && (
                checkIsSuperAdmin(currentUser) ? (
                  <FinanceModule
                    records={financeRecords}
                    currentUser={currentUser}
                    onSaveRecord={handleSaveFinanceRecord}
                    onDeleteRecord={handleDeleteFinanceRecord}
                  />
                ) : (
                  <div className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Akses Dibatasi (Super Admin Only)</h2>
                    <p className="text-xs text-slate-600">
                      Menu Divisi Dana & Keuangan bersifat rahasia dan hanya dapat diakses oleh akun Super Admin.
                    </p>
                  </div>
                )
              )}

              {/* Menu Super Admin */}
              {activeTab === 'super_admin' && (
                (currentUser.role === 'Super Admin' || currentUser.username === 'superadmin' || currentUser.isSuperAdmin) ? (
                  <SuperAdminModule
                    users={users}
                    currentUser={currentUser}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onLogAudit={createLog}
                  />
                ) : (
                  <div className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                    <h2 className="text-lg font-black text-slate-900">Akses Dibatasi</h2>
                    <p className="text-xs text-slate-600">Menu ini khusus untuk akun Super Admin SBN KASBI.</p>
                  </div>
                )
              )}

              {/* System & Users */}
              {activeTab === 'system' && (
                (currentUser.role === 'Super Admin' || currentUser.username === 'superadmin' || currentUser.isSuperAdmin) ? (
                  <UserManagementModule
                    users={users}
                    auditLogs={auditLogs}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onResetSystem={handleResetSystem}
                    currentUser={currentUser}
                  />
                ) : (
                  <div className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                    <h2 className="text-lg font-black text-slate-900">Akses Dibatasi</h2>
                    <p className="text-xs text-slate-600">Menu Pengaturan & Audit System khusus untuk akun Super Admin.</p>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Bottom Navigation Bar (Home, PKB, Profil) */}
      <FloatingBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
        }}
        onOpenPkb={() => setIsPkbModalOpen(true)}
      />

      {/* Printable / Downloadable Member Card Modal */}
      {selectedCardMember && (
        <MemberIdCardModal
          member={selectedCardMember}
          allMembers={members}
          onUpdateMember={handleUpdateMember}
          onClose={() => setSelectedCardMember(null)}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          auditLogs={activeNotifications}
          onClose={() => setIsNotificationsOpen(false)}
          onClearNotifications={handleClearNotifications}
          onDeleteSingleNotification={handleDeleteSingleNotification}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* PKB & Peraturan Modal */}
      <PkbModal
        isOpen={isPkbModalOpen}
        onClose={() => setIsPkbModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Global Scan KTA Modal */}
      {isScanModalOpen && (
        <ModalPortal>
          <div className="mobile-modal-backdrop">
            <div className="mobile-modal-card bg-white border border-slate-200 rounded-2xl max-w-sm p-6 shadow-2xl relative text-center space-y-4">
              <button onClick={() => setIsScanModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Scan KTA Digital SBN KASBI</h3>
                <p className="text-xs text-slate-600 mt-1">Arahkan kamera ke QR Code KTA Anggota untuk memverifikasi status keanggotaan.</p>
              </div>
              <div className="w-48 h-48 mx-auto bg-slate-900 border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full h-1 bg-red-600 absolute animate-pulse" />
                <QrCode className="w-24 h-24 text-red-400 opacity-60" />
                <span className="text-[10px] text-slate-300 font-bold mt-2">Kamera Aktif...</span>
              </div>
              <button onClick={() => setIsScanModalOpen(false)} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer">
                Tutup Scanner
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
