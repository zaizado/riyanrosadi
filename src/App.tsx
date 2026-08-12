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
import { useAppData } from './hooks/useAppData';
import {
  getCurrentUser,
  setCurrentUser,
  sortAuditLogsNewestFirst,
  resetAllData 
} from './lib/storage';

import {
  subscribeCollection,
  saveFirestoreDoc,
  saveFullCollection,
  deleteFirestoreDoc
} from './lib/firebase';

import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

export default function App() {
  // State Initialization from Firestore via Hook
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
    notulensiFiles, setNotulensiFiles,
    isSyncOffline,
    syncState
  } = useAppData();

  const [currentUser, setCurrentUserAccount] = useState<UserAccount>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Subscribe to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        // Match user profile in loaded users array or construct profile
        const emailLower = firebaseUser.email?.toLowerCase() || '';
        let matched = users.find(u => u.id === firebaseUser.uid || u.email?.toLowerCase() === emailLower);
        if (!matched) {
          const isSA = emailLower === 'superadmin@sbn-kasbi-vci.or.id';
          matched = {
            id: firebaseUser.uid,
            username: isSA ? 'sbnkasbivci1' : (emailLower ? emailLower.split('@')[0] : 'user'),
            name: isSA ? 'Super Admin SBN KASBI' : (firebaseUser.displayName || 'Pengurus SBN KASBI'),
            email: firebaseUser.email || 'user@sbn-kasbi-vci.or.id',
            nik: isSA ? 'SA-00001' : '010000',
            role: isSA ? 'Super Admin' : 'Pengurus',
            department: isSA ? 'Dewan Pimpinan Utama' : 'PT Victory Chingluh Indonesia',
            isSuperAdmin: isSA,
            avatarUrl: cheAvatar
          };
          saveFirestoreDoc('users', matched).catch(err => console.warn('Could not auto-save user profile to firestore', err));
        }
        setCurrentUserAccount(matched);
        setCurrentUser(matched);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, [users]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserAccount(user);
    setCurrentUser(user);
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

  // Realtime Sync: Keep active currentUser state in sync with Firestore users collection
  useEffect(() => {
    if (isLoggedIn && currentUser?.id && users && users.length > 0) {
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
  }, [users, isLoggedIn, currentUser?.id, currentUser?.username, currentUser?.nik]);

// Ensure default light theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

// Auto scroll to top when changing active menu/tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

// Modals state
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

// Helper to log audit with sound tone
  const createLog = async (modul: AuditLog['modul'], aksi: string, detail: string) => {
    const isSuper = checkIsSuperAdmin(currentUser);
// Notifikasi & suara untuk Keuangan hanya aktif untuk Super Admin
    if (modul !== 'Keuangan' || isSuper) {
      playNotificationSound();
    }
    await AuditService.createLog(currentUser.name, currentUser.role, modul, aksi, detail);
  };

// Helper to derive stable, personal user key for notification tracking
  const getUserNotifKey = (user?: UserAccount | null): string => {
    if (!user) return 'guest';
    const raw = user.username || user.nik || user.id || user.name || 'guest';
    const clean = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return clean || 'guest';
  };

  const userNotifKey = getUserNotifKey(currentUser);

// Track cleared notification IDs per user account (stored locally & synced to Firestore doc per user)
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`sbn_cleared_notifs_${userNotifKey}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

// Re-sync cleared notifications when active user account changes or Firestore updates
  useEffect(() => {
    if (!userNotifKey) return;

// 1. Load from localStorage
    let localCleared: string[] = [];
    try {
      const stored = localStorage.getItem(`sbn_cleared_notifs_${userNotifKey}`);
      if (stored) localCleared = JSON.parse(stored);
    } catch {
      localCleared = [];
    }
    setClearedNotifIds(localCleared);

// 2. Realtime sync with Firestore userClearedNotifs collection
    const unsub = subscribeCollection<{ id: string; clearedIds?: string[] }>('userClearedNotifs', [], (docs) => {
      const userDoc = docs.find(d => d.id === userNotifKey);
      if (userDoc && Array.isArray(userDoc.clearedIds)) {
        const merged = Array.from(new Set([...localCleared, ...userDoc.clearedIds]));
        setClearedNotifIds(merged);
        try {
          localStorage.setItem(`sbn_cleared_notifs_${userNotifKey}`, JSON.stringify(merged));
        } catch {
        }
      }
    });

    return () => unsub();
  }, [userNotifKey]);

// Active notifications for current user account
  const isSuperAdminUser = checkIsSuperAdmin(currentUser);
  const clearedSet = new Set(clearedNotifIds);
  const activeNotifications = sortAuditLogsNewestFirst(auditLogs.filter(log => {
    if (!log.id || clearedSet.has(log.id)) return false;
// Notifikasi keuangan (divisi dana dan usaha) hanya untuk Super Admin
    if (!isSuperAdminUser && log.modul === 'Keuangan') return false;
    return true;
  }));

// Delete a single notification for current user account
  const handleDeleteSingleNotification = async (logId: string) => {
    if (!logId) return;
    const updated = Array.from(new Set([...clearedNotifIds, logId]));
    setClearedNotifIds(updated);
    try {
      localStorage.setItem(`sbn_cleared_notifs_${userNotifKey}`, JSON.stringify(updated));
      await AppService.updateUserClearedNotifs(userNotifKey, updated); //
    } catch (err) {
      console.error('Failed to store single cleared notification:', err);
    }
  };

// Clear all active notifications for current user account
  const handleClearNotifications = async () => {
    const currentIds = activeNotifications.map(l => l.id).filter(Boolean) as string[];
    const updated = Array.from(new Set([...clearedNotifIds, ...currentIds]));
    setClearedNotifIds(updated);
    try {
      localStorage.setItem(`sbn_cleared_notifs_${userNotifKey}`, JSON.stringify(updated));
      await AppService.updateUserClearedNotifs(userNotifKey, updated); //
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
    const updated = [newMbr, ...members];
    setMembers(updated);
    await AppService.addMember(newMbr);
    await createLog('Data Anggota', 'Tambah Anggota Baru', `Menambahkan anggota ${newMbr.namaLengkap} (${newMbr.nomorAnggota}) Dept ${newMbr.departemen}.`);
  };

  const handleUpdateMember = async (updatedMbr: Member) => {
    const updated = members.map(m => m.id === updatedMbr.id ? updatedMbr : m);
    setMembers(updated);
    await AppService.updateMember(updatedMbr);

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
        const updatedUsersList = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        setUsers(updatedUsersList);
        await AppService.addUser(updatedUser);
        if (currentUser.id === updatedUser.id) {
          setCurrentUserAccount(updatedUser);
          setCurrentUser(updatedUser);
        }
      }
    }

    await createLog('Data Anggota', 'Update Data Anggota', `Memperbarui biodata ${updatedMbr.namaLengkap} (${updatedMbr.nomorAnggota}).`);
  };

  const handleDeleteMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    await AppService.deleteMember(memberId);
    if (target) {
      await createLog('Data Anggota', 'Hapus Anggota', `Menghapus data anggota ${target.namaLengkap} (${target.nomorAnggota}).`);
    }
  };

  const handleImportMembers = async (importedMembers: Member[]) => {
    setMembers(importedMembers);
    await AppService.saveAllMembers(importedMembers);
    await createLog('Data Anggota', 'Import Spreadsheet Data Anggota', `Berhasil melakukan impor/sinkronisasi ${importedMembers.length} data anggota dari Excel/CSV.`);
  };

// ADVOCACY HANDLERS
  const handleAddAdvocacyCase = async (newCase: AdvocacyCase) => {
    const updated = [newCase, ...advocacyCases];
    setAdvocacyCases(updated);
    await AppService.addAdvocacy(newCase);
    await createLog('Advokasi', 'Buat Kasus Advokasi Baru', `Dibuat kasus ${newCase.nomorKasus} - ${newCase.judulKasus} untuk ${newCase.namaAnggota}.`);
  };

  const handleUpdateAdvocacyCase = async (updatedCase: AdvocacyCase) => {
    const updated = advocacyCases.map(c => c.id === updatedCase.id ? updatedCase : c);
    setAdvocacyCases(updated);
    await AppService.updateAdvocacy(updatedCase);
    await createLog('Advokasi', 'Update Status Advokasi', `Memperbarui status kasus ${updatedCase.nomorKasus} menjadi ${updatedCase.status}.`);
  };

  const handleDeleteAdvocacyCase = async (caseId: string) => {
    const target = advocacyCases.find(c => c.id === caseId);
    const updated = advocacyCases.filter(c => c.id !== caseId);
    setAdvocacyCases(updated);
    await deleteFirestoreDoc('advocacyCases', caseId);
    if (target) {
      await createLog('Advokasi', 'Hapus Kasus Advokasi', `Menghapus kasus advokasi ${target.nomorKasus} (${target.judulKasus}).`);
    }
  };

// SICK VISIT HANDLERS
  const handleAddSickVisit = async (newVisit: SickVisit) => {
    const updated = [newVisit, ...sickVisits];
    setSickVisits(updated);
    await AppService.addSickVisit(newVisit);
    await createLog('Anggota Sakit', 'Catat Pendampingan Sakit', `Pencatatan pendampingan sakit ${newVisit.nomorPendampingan} untuk ${newVisit.namaAnggota} di ${newVisit.lokasi}.`);
  };

  const handleUpdateSickVisit = async (updatedVisit: SickVisit) => {
    const updated = sickVisits.map(v => v.id === updatedVisit.id ? updatedVisit : v);
    setSickVisits(updated);
    await AppService.updateSickVisit(updatedVisit);
    await createLog('Anggota Sakit', 'Update Visite Kesehatan', `Memperbarui log pendampingan ${updatedVisit.nomorPendampingan} (${updatedVisit.namaAnggota}).`);
  };

  const handleDeleteSickVisit = async (visitId: string) => {
    const target = sickVisits.find(v => v.id === visitId);
    const updated = sickVisits.filter(v => v.id !== visitId);
    setSickVisits(updated);
    await AppService.deleteSickVisit(visitId);
    if (target) {
      await createLog('Anggota Sakit', 'Hapus Data Visite Sakit', `Menghapus data pendampingan sakit ${target.nomorPendampingan} (${target.namaAnggota}).`);
    }
  };

// AGENDA HANDLERS
  const handleAddAgenda = async (newAgd: OrganizationAgenda) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    const updated = [newAgd, ...agendas];
    setAgendas(updated);
    await AppService.addAgenda(newAgd);
    await createLog('Agenda', 'Tambah Agenda Kegiatan', `Menambahkan agenda baru: ${newAgd.judul} (${newAgd.jenis}) pada ${newAgd.tanggalWaktu}.`);
  };

  const handleUpdateAgenda = async (updatedAgd: OrganizationAgenda) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    const updated = agendas.map(a => a.id === updatedAgd.id ? updatedAgd : a);
    setAgendas(updated);
    await AppService.updateAgenda(updatedAgd);
    await createLog('Agenda', 'Update Agenda Kegiatan', `Memperbarui detail agenda ${updatedAgd.judul}.`);
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!checkIsSuperAdmin(currentUser)) return;
    const target = agendas.find(a => a.id === agendaId);
    const updated = agendas.filter(a => a.id !== agendaId);
    setAgendas(updated);
    await AppService.deleteAgenda(agendaId);
    if (target) {
      await createLog('Agenda', 'Hapus Agenda Kegiatan', `Menghapus agenda ${target.judul}.`);
    }
  };

// FUNDRAISING HANDLERS
  const handleAddFundraisingCampaign = async (newCamp: FundraisingCampaign) => {
    const updated = [newCamp, ...fundraisingCampaigns];
    setFundraisingCampaigns(updated);
    await AppService.addFundraising(newCamp);
    await createLog(
      'Penggalangan Dana',
      'Buat Penggalangan Dana Baru',
      `Membuat penggalangan dana ${newCamp.nomorPenggalangan} untuk ${newCamp.namaAnggota} (${newCamp.nikAnggota}) - Hubungan: ${newCamp.hubungan}, Kondisi: ${newCamp.kondisi}.`
    );
  };

  const handleUpdateFundraisingCampaign = async (updatedCamp: FundraisingCampaign) => {
    const updated = fundraisingCampaigns.map(c => c.id === updatedCamp.id ? updatedCamp : c);
    setFundraisingCampaigns(updated);
    await AppService.updateFundraising(updatedCamp);
    await createLog(
      'Penggalangan Dana',
      'Update Penggalangan Dana',
      `Memperbarui penggalangan dana ${updatedCamp.nomorPenggalangan} (${updatedCamp.namaAnggota}) - Dana Terkumpul: Rp ${updatedCamp.jumlahTerkumpul.toLocaleString('id-ID')}.`
    );
  };

  const handleDeleteFundraisingCampaign = async (id: string) => {
    const target = fundraisingCampaigns.find(c => c.id === id);
    const updated = fundraisingCampaigns.filter(c => c.id !== id);
    setFundraisingCampaigns(updated);
    await AppService.deleteFundraising(id);
    if (target) {
      await createLog(
        'Penggalangan Dana',
        'Hapus Penggalangan Dana',
        `Menghapus penggalangan dana ${target.nomorPenggalangan} untuk ${target.namaAnggota}.`
      );
    }
  };

// SEMBAKO HANDLERS
  const handleAddSembakoEvent = async (newEvent: SembakoEvent, initialClaims: SembakoClaim[]) => {
    const updatedEvents = [newEvent, ...sembakoEvents];
    const updatedClaims = [...initialClaims, ...sembakoClaims];
    
    setSembakoEvents(updatedEvents);

    setSembakoClaims(updatedClaims);

    AppService.addSembakoEvent(newEvent);
    AppService.saveAllSembakoClaims(updatedClaims);
    createLog('Sembako', 'Buat Event Sembako Baru', `Membuat event ${newEvent.namaEvent} untuk ${newEvent.totalPenerima} anggota aktif.`);
  };

  const handleUpdateSembakoClaim = async (updatedClaim: SembakoClaim) => {
    const updatedClaimsList = sembakoClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c);
    setSembakoClaims(updatedClaimsList);
    await AppService.updateSembakoClaim(updatedClaim);

    // Update event counter in Firestore
    const eventObj = sembakoEvents.find(e => e.id === updatedClaim.eventId);
    if (eventObj) {
      const totalClaimed = updatedClaimsList.filter(c => c.eventId === eventObj.id && c.status === 'Sudah Ambil').length;
      const updatedEvent: SembakoEvent = { ...eventObj, totalSudahAmbil: totalClaimed };
      const updatedEvList = sembakoEvents.map(e => e.id === eventObj.id ? updatedEvent : e);
      setSembakoEvents(updatedEvList);
      await AppService.updateSembakoEvent(updatedEvent);
    }

    await createLog('Sembako', 'Update Klaim Sembako', `Pembaruan klaim sembako untuk ${updatedClaim.namaLengkap} (${updatedClaim.nomorAnggota}) status: ${updatedClaim.status}.`);
  };

  const handleDeleteSembakoEvent = async (eventId: string) => {
    const eventToDelete = sembakoEvents.find(e => e.id === eventId);
    const updatedEvents = sembakoEvents.filter(e => e.id !== eventId);
    const updatedClaims = sembakoClaims.filter(c => c.eventId !== eventId);
    
    setSembakoEvents(updatedEvents);
    setSembakoClaims(updatedClaims);

    await deleteFirestoreDoc('sembakoEvents', eventId);
    const claimsToDelete = sembakoClaims.filter(c => c.eventId === eventId);
    for (const claim of claimsToDelete) {
      await deleteFirestoreDoc('sembakoClaims', claim.id);
    }

    await createLog('Sembako', 'Hapus Event Sembako', `Menghapus event sembako "${eventToDelete?.namaEvent || eventId}" beserta seluruh data klaim anggotanya`);
  };

  const handleDeleteSembakoClaim = async (claimId: string) => {
    const target = sembakoClaims.find(c => c.id === claimId);
    const updatedClaims = sembakoClaims.filter(c => c.id !== claimId);
    setSembakoClaims(updatedClaims);

    await deleteFirestoreDoc('sembakoClaims', claimId);

    if (target) {
      const eventObj = sembakoEvents.find(e => e.id === target.eventId);
      if (eventObj) {
        const remaining = updatedClaims.filter(c => c.eventId === eventObj.id);
        const totalSudah = remaining.filter(c => c.status === 'Sudah Ambil').length;
        const updatedEv: SembakoEvent = {
          ...eventObj,
          totalPenerima: remaining.length,
          totalSudahAmbil: totalSudah,
        };
        const updatedEvList = sembakoEvents.map(e => e.id === eventObj.id ? updatedEv : e);
        setSembakoEvents(updatedEvList);
        await AppService.updateSembakoEvent(updatedEv);
      }
      await createLog('Sembako', 'Hapus Klaim Sembako', `Menghapus data sembako penerima ${target.namaLengkap} (${target.nomorAnggota}).`);
    }
  };

  // VEHICLE HANDLERS
  const handleAddVehicleLog = async (newLog: VehicleLog) => {
    const updated = [newLog, ...vehicleLogs];
    setVehicleLogs(updated);
    await AppService.addVehicleLog(newLog);
    await createLog('Kendaraan', 'Catat Pemakaian Kendaraan', `Mencatat jurnal ${newLog.nomorLog} untuk ${newLog.kendaraan} (${newLog.platNomor}) oleh ${newLog.namaPemakai}.`);
  };

  const handleUpdateVehicleLog = async (updatedLog: VehicleLog) => {
    const updated = vehicleLogs.map(v => v.id === updatedLog.id ? updatedLog : v);
    setVehicleLogs(updated);
    await AppService.updateVehicleLog(updatedLog);
    await createLog('Kendaraan', 'Update Pemakaian Kendaraan', `Memperbarui jurnal ${updatedLog.nomorLog} (${updatedLog.kendaraan}) status: ${updatedLog.status}.`);
  };

  const handleDeleteVehicleLog = async (id: string) => {
    const target = vehicleLogs.find(v => v.id === id);
    const updated = vehicleLogs.filter(v => v.id !== id);
    setVehicleLogs(updated);
    await AppService.deleteVehicleLog(id);
    if (target) {
      await createLog('Kendaraan', 'Hapus Jurnal Kendaraan', `Menghapus jurnal ${target.nomorLog} (${target.kendaraan}).`);
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

    const existingIdx = financeRecords.findIndex(f => f.id === cleanRecord.id || f.tanggal === cleanRecord.tanggal);
    let updatedList: FinanceDailyRecord[] = [];
    if (existingIdx >= 0) {
      updatedList = [...financeRecords];
      updatedList[existingIdx] = cleanRecord;
    } else {
      updatedList = [cleanRecord, ...financeRecords];
    }

    setFinanceRecords(updatedList);
    await AppService.addFinanceRecord(cleanRecord);
    await createLog('Keuangan', 'Update Kas Keuangan', `Catatan kas tanggal ${cleanRecord.tanggal}, COS Masuk: Rp ${cleanRecord.uangCosMasuk.toLocaleString('id-ID')}, Items Pengeluaran: ${cleanRecord.pengeluaranItems.length}.`);
  };

  const handleDeleteFinanceRecord = async (id: string) => {
    const target = financeRecords.find(f => f.id === id);
    const updatedList = financeRecords.filter(f => f.id !== id);
    setFinanceRecords(updatedList);
    await AppService.deleteFinanceRecord(id);
    if (target) {
      await createLog('Keuangan', 'Hapus Transaksi Kas', `Menghapus catatan kas tanggal ${target.tanggal}.`);
    }
  };

  // USER MANAGEMENT HANDLERS
  const handleAddUser = async (newUsr: UserAccount) => {
    let userToSave = newUsr;
    if (userToSave.avatarUrl && userToSave.avatarUrl.length > 80000 && userToSave.avatarUrl.startsWith('data:image')) {
      const compressed = await compressImage(userToSave.avatarUrl, 300, 300, 0.75);
      userToSave = { ...userToSave, avatarUrl: compressed };
    }
    const updated = [userToSave, ...users];
    setUsers(updated);
    await AppService.addUser(userToSave);
    await createLog('Sistem', 'Tambah User Pengurus', `Menambahkan akun pengurus baru ${userToSave.name} (${userToSave.role}).`);
  };

  const handleUpdateUser = async (updatedUsr: UserAccount) => {
    let userToSave = updatedUsr;
    if (userToSave.avatarUrl && userToSave.avatarUrl.length > 80000 && userToSave.avatarUrl.startsWith('data:image')) {
      const compressed = await compressImage(userToSave.avatarUrl, 300, 300, 0.75);
      userToSave = { ...userToSave, avatarUrl: compressed };
    }
    const updated = users.map(u => u.id === userToSave.id ? userToSave : u);
    setUsers(updated);
    await AppService.addUser(userToSave);
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
        const updatedMembers = members.map(m => m.id === updatedMember.id ? updatedMember : m);
        setMembers(updatedMembers);
        await AppService.updateMember(updatedMember);
      }
    }

    await createLog('Sistem', 'Update Profil Pengguna', `Pengguna ${userToSave.name} (${userToSave.role}) memperbarui data profil akun (Email/WhatsApp/Foto).`);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    await AppService.deleteUser(userId);
    if (target) {
      await createLog('Sistem', 'Hapus Akun Pengurus', `Menghapus akun pengurus ${target.name} (@${target.username}).`);
    }
  };

  const handleResetSystem = () => {
    resetAllData();
    window.location.reload();
  };

  // If not logged in, enforce login screen first
  if (!isLoggedIn) {
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
      {syncState === 'error' && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 text-amber-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 z-20 shadow-md">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
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
                />
              )}

              {/* Menu Penggalangan Dana */}
              {activeTab === 'fundraising' && (
                <FundraisingModule
                  campaigns={fundraisingCampaigns}
                  members={members}
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

      {/* Global Floating Bottom Navigation Bar (Home, Informasi, Scan, Profil) */}
      <FloatingBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
        }}
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
