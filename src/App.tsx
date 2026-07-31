import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MembersModule } from './components/MembersModule';
import { AdvocacyModule } from './components/AdvocacyModule';
import { SickVisitModule } from './components/SickVisitModule';
import { AgendaModule } from './components/AgendaModule';
import { SembakoModule } from './components/SembakoModule';
import { VehicleManager } from './components/VehicleManager';
import { FinanceModule } from './components/FinanceModule';
import { UserManagementModule } from './components/UserManagementModule';
import { SuperAdminModule } from './components/SuperAdminModule';
import { MemberIdCardModal } from './components/MemberIdCardModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginModal } from './components/LoginModal';
import { playNotificationSound } from './lib/audio';

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
  checkIsSuperAdmin
} from './types';

import { 
  getStoredUsers, 
  setStoredUsers, 
  getCurrentUser, 
  setCurrentUser, 
  getStoredMembers, 
  setStoredMembers, 
  getStoredAdvocacy, 
  setStoredAdvocacy, 
  getStoredSickVisits, 
  setStoredSickVisits, 
  getStoredAgendas, 
  setStoredAgendas, 
  getStoredSembakoEvents, 
  setStoredSembakoEvents, 
  getStoredSembakoClaims, 
  setStoredSembakoClaims, 
  getStoredAuditLogs, 
  getStoredVehicles,
  setStoredVehicles,
  getStoredFinance,
  setStoredFinance,
  addAuditLog, 
  resetAllData 
} from './lib/storage';

import {
  subscribeCollection,
  saveFirestoreDoc,
  saveFullCollection,
  deleteFirestoreDoc
} from './lib/firebase';

export default function App() {
  // State Initialization from LocalStorage (initial fallback)
  const [currentUser, setCurrentUserAccount] = useState<UserAccount>(() => getCurrentUser());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [members, setMembers] = useState<Member[]>(() => getStoredMembers());
  const [advocacyCases, setAdvocacyCases] = useState<AdvocacyCase[]>(() => getStoredAdvocacy());
  const [sickVisits, setSickVisits] = useState<SickVisit[]>(() => getStoredSickVisits());
  const [agendas, setAgendas] = useState<OrganizationAgenda[]>(() => getStoredAgendas());
  const [sembakoEvents, setSembakoEvents] = useState<SembakoEvent[]>(() => getStoredSembakoEvents());
  const [sembakoClaims, setSembakoClaims] = useState<SembakoClaim[]>(() => getStoredSembakoClaims());
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>(() => getStoredVehicles());
  const [financeRecords, setFinanceRecords] = useState<FinanceDailyRecord[]>(() => getStoredFinance());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());

  // Subscribe to Realtime Firestore Collections
  useEffect(() => {
    const unsubMembers = subscribeCollection<Member>('members', getStoredMembers(), (items) => {
      setMembers(items);
      setStoredMembers(items);
    });

    const unsubAdvocacy = subscribeCollection<AdvocacyCase>('advocacyCases', getStoredAdvocacy(), (items) => {
      setAdvocacyCases(items);
      setStoredAdvocacy(items);
    });

    const unsubSickVisits = subscribeCollection<SickVisit>('sickVisits', getStoredSickVisits(), (items) => {
      setSickVisits(items);
      setStoredSickVisits(items);
    });

    const unsubAgendas = subscribeCollection<OrganizationAgenda>('agendas', getStoredAgendas(), (items) => {
      setAgendas(items);
      setStoredAgendas(items);
    });

    const unsubSembakoEvents = subscribeCollection<SembakoEvent>('sembakoEvents', getStoredSembakoEvents(), (items) => {
      setSembakoEvents(items);
      setStoredSembakoEvents(items);
    });

    const unsubSembakoClaims = subscribeCollection<SembakoClaim>('sembakoClaims', getStoredSembakoClaims(), (items) => {
      setSembakoClaims(items);
      setStoredSembakoClaims(items);
    });

    const unsubVehicles = subscribeCollection<VehicleLog>('vehicleLogs', getStoredVehicles(), (items) => {
      setVehicleLogs(items);
      setStoredVehicles(items);
    });

    const unsubFinance = subscribeCollection<FinanceDailyRecord>('financeRecords', getStoredFinance(), (items) => {
      setFinanceRecords(items);
      setStoredFinance(items);
    });

    const unsubUsers = subscribeCollection<UserAccount>('users', getStoredUsers(), (items) => {
      setUsers(items);
      setStoredUsers(items);
    });

    const unsubAudit = subscribeCollection<AuditLog>('auditLogs', getStoredAuditLogs(), (items) => {
      setAuditLogs(items);
    });

    return () => {
      unsubMembers();
      unsubAdvocacy();
      unsubSickVisits();
      unsubAgendas();
      unsubSembakoEvents();
      unsubSembakoClaims();
      unsubVehicles();
      unsubFinance();
      unsubUsers();
      unsubAudit();
    };
  }, []);

  // Authentication State with "Remember Me" / session check
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('sbn_vci_logged_in') === 'true' || sessionStorage.getItem('sbn_vci_logged_in') === 'true';
  });

  const handleLoginSuccess = (user: UserAccount, rememberMe: boolean) => {
    setCurrentUserAccount(user);
    setCurrentUser(user);
    setIsLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem('sbn_vci_logged_in', 'true');
    } else {
      sessionStorage.setItem('sbn_vci_logged_in', 'true');
      localStorage.removeItem('sbn_vci_logged_in');
    }

    playNotificationSound();
    createLog('Sistem', 'Login', `Pengurus ${user.name} (${user.role}) berhasil masuk ke sistem`);
  };

  const handleLogout = () => {
    localStorage.removeItem('sbn_vci_logged_in');
    sessionStorage.removeItem('sbn_vci_logged_in');
    setIsLoggedIn(false);
    playNotificationSound();
  };

  // Navigation & Frame UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Modals state
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Helper to log audit with sound tone
  const createLog = async (modul: AuditLog['modul'], aksi: string, detail: string) => {
    playNotificationSound();
    const logs = addAuditLog(currentUser.name, currentUser.role, modul, aksi, detail);
    if (logs.length > 0) {
      await saveFirestoreDoc('auditLogs', logs[0]);
    }
  };

  // Switch Active Role User
  const handleSwitchUser = (newUser: UserAccount) => {
    setCurrentUserAccount(newUser);
    setCurrentUser(newUser);
  };

  // MEMBERS HANDLERS
  const handleAddMember = async (newMbr: Member) => {
    await saveFirestoreDoc('members', newMbr);
    await createLog('Data Anggota', 'Tambah Anggota Baru', `Menambahkan anggota ${newMbr.namaLengkap} (${newMbr.nomorAnggota}) Dept ${newMbr.departemen}.`);
  };

  const handleUpdateMember = async (updatedMbr: Member) => {
    await saveFirestoreDoc('members', updatedMbr);
    await createLog('Data Anggota', 'Update Data Anggota', `Memperbarui biodata ${updatedMbr.namaLengkap} (${updatedMbr.nomorAnggota}).`);
  };

  const handleDeleteMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    setStoredMembers(updated);
    await deleteFirestoreDoc('members', memberId);
    if (target) {
      await createLog('Data Anggota', 'Hapus Anggota', `Menghapus data anggota ${target.namaLengkap} (${target.nomorAnggota}).`);
    }
  };

  const handleImportMembers = async (importedMembers: Member[]) => {
    setMembers(importedMembers);
    setStoredMembers(importedMembers);
    saveFullCollection('members', importedMembers);
    createLog('Data Anggota', 'Import Spreadsheet Data Anggota', `Berhasil melakukan impor/sinkronisasi ${importedMembers.length} data anggota dari Excel/CSV.`);
  };

  // ADVOCACY HANDLERS
  const handleAddAdvocacyCase = async (newCase: AdvocacyCase) => {
    const updated = [newCase, ...advocacyCases];
    setAdvocacyCases(updated);
    setStoredAdvocacy(updated);
    await saveFirestoreDoc('advocacyCases', newCase);
    await createLog('Advokasi', 'Buat Kasus Advokasi Baru', `Dibuat kasus ${newCase.nomorKasus} - ${newCase.judulKasus} untuk ${newCase.namaAnggota}.`);
  };

  const handleUpdateAdvocacyCase = async (updatedCase: AdvocacyCase) => {
    const updated = advocacyCases.map(c => c.id === updatedCase.id ? updatedCase : c);
    setAdvocacyCases(updated);
    setStoredAdvocacy(updated);
    await saveFirestoreDoc('advocacyCases', updatedCase);
    await createLog('Advokasi', 'Update Status Advokasi', `Memperbarui status kasus ${updatedCase.nomorKasus} menjadi ${updatedCase.status}.`);
  };

  const handleDeleteAdvocacyCase = async (caseId: string) => {
    const target = advocacyCases.find(c => c.id === caseId);
    const updated = advocacyCases.filter(c => c.id !== caseId);
    setAdvocacyCases(updated);
    setStoredAdvocacy(updated);
    await deleteFirestoreDoc('advocacyCases', caseId);
    if (target) {
      await createLog('Advokasi', 'Hapus Kasus Advokasi', `Menghapus kasus advokasi ${target.nomorKasus} (${target.judulKasus}).`);
    }
  };

  // SICK VISIT HANDLERS
  const handleAddSickVisit = async (newVisit: SickVisit) => {
    const updated = [newVisit, ...sickVisits];
    setSickVisits(updated);
    setStoredSickVisits(updated);
    await saveFirestoreDoc('sickVisits', newVisit);
    await createLog('Anggota Sakit', 'Catat Pendampingan Sakit', `Pencatatan pendampingan sakit ${newVisit.nomorPendampingan} untuk ${newVisit.namaAnggota} di ${newVisit.lokasi}.`);
  };

  const handleUpdateSickVisit = async (updatedVisit: SickVisit) => {
    const updated = sickVisits.map(v => v.id === updatedVisit.id ? updatedVisit : v);
    setSickVisits(updated);
    setStoredSickVisits(updated);
    await saveFirestoreDoc('sickVisits', updatedVisit);
    await createLog('Anggota Sakit', 'Update Visite Kesehatan', `Memperbarui log pendampingan ${updatedVisit.nomorPendampingan} (${updatedVisit.namaAnggota}).`);
  };

  const handleDeleteSickVisit = async (visitId: string) => {
    const target = sickVisits.find(v => v.id === visitId);
    const updated = sickVisits.filter(v => v.id !== visitId);
    setSickVisits(updated);
    setStoredSickVisits(updated);
    await deleteFirestoreDoc('sickVisits', visitId);
    if (target) {
      await createLog('Anggota Sakit', 'Hapus Data Visite Sakit', `Menghapus data pendampingan sakit ${target.nomorPendampingan} (${target.namaAnggota}).`);
    }
  };

  // AGENDA HANDLERS
  const handleAddAgenda = async (newAgd: OrganizationAgenda) => {
    const updated = [newAgd, ...agendas];
    setAgendas(updated);
    setStoredAgendas(updated);
    await saveFirestoreDoc('agendas', newAgd);
    await createLog('Agenda', 'Tambah Agenda Kegiatan', `Menambahkan agenda baru: ${newAgd.judul} (${newAgd.jenis}) pada ${newAgd.tanggalWaktu}.`);
  };

  const handleUpdateAgenda = async (updatedAgd: OrganizationAgenda) => {
    const updated = agendas.map(a => a.id === updatedAgd.id ? updatedAgd : a);
    setAgendas(updated);
    setStoredAgendas(updated);
    await saveFirestoreDoc('agendas', updatedAgd);
    await createLog('Agenda', 'Update Agenda Kegiatan', `Memperbarui detail agenda ${updatedAgd.judul}.`);
  };

  const handleDeleteAgenda = async (agendaId: string) => {
    const target = agendas.find(a => a.id === agendaId);
    const updated = agendas.filter(a => a.id !== agendaId);
    setAgendas(updated);
    setStoredAgendas(updated);
    await deleteFirestoreDoc('agendas', agendaId);
    if (target) {
      await createLog('Agenda', 'Hapus Agenda Kegiatan', `Menghapus agenda ${target.judul}.`);
    }
  };

  // SEMBAKO HANDLERS
  const handleAddSembakoEvent = async (newEvent: SembakoEvent, initialClaims: SembakoClaim[]) => {
    const updatedEvents = [newEvent, ...sembakoEvents];
    const updatedClaims = [...initialClaims, ...sembakoClaims];
    
    setSembakoEvents(updatedEvents);
    setStoredSembakoEvents(updatedEvents);

    setSembakoClaims(updatedClaims);
    setStoredSembakoClaims(updatedClaims);

    saveFirestoreDoc('sembakoEvents', newEvent);
    saveFullCollection('sembakoClaims', updatedClaims);
    createLog('Sembako', 'Buat Event Sembako Baru', `Membuat event ${newEvent.namaEvent} untuk ${newEvent.totalPenerima} anggota aktif.`);
  };

  const handleUpdateSembakoClaim = async (updatedClaim: SembakoClaim) => {
    const updatedClaimsList = sembakoClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c);
    setSembakoClaims(updatedClaimsList);
    setStoredSembakoClaims(updatedClaimsList);
    await saveFirestoreDoc('sembakoClaims', updatedClaim);

    // Update event counter in Firestore
    const eventObj = sembakoEvents.find(e => e.id === updatedClaim.eventId);
    if (eventObj) {
      const totalClaimed = updatedClaimsList.filter(c => c.eventId === eventObj.id && c.status === 'Sudah Ambil').length;
      const updatedEvent: SembakoEvent = { ...eventObj, totalSudahAmbil: totalClaimed };
      const updatedEvList = sembakoEvents.map(e => e.id === eventObj.id ? updatedEvent : e);
      setSembakoEvents(updatedEvList);
      setStoredSembakoEvents(updatedEvList);
      await saveFirestoreDoc('sembakoEvents', updatedEvent);
    }

    await createLog('Sembako', 'Update Klaim Sembako', `Pembaruan klaim sembako untuk ${updatedClaim.namaLengkap} (${updatedClaim.nomorAnggota}) status: ${updatedClaim.status}.`);
  };

  const handleDeleteSembakoEvent = async (eventId: string) => {
    const eventToDelete = sembakoEvents.find(e => e.id === eventId);
    const updatedEvents = sembakoEvents.filter(e => e.id !== eventId);
    const updatedClaims = sembakoClaims.filter(c => c.eventId !== eventId);
    
    setSembakoEvents(updatedEvents);
    setStoredSembakoEvents(updatedEvents);
    setSembakoClaims(updatedClaims);
    setStoredSembakoClaims(updatedClaims);

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
    setStoredSembakoClaims(updatedClaims);

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
        setStoredSembakoEvents(updatedEvList);
        await saveFirestoreDoc('sembakoEvents', updatedEv);
      }
      await createLog('Sembako', 'Hapus Klaim Sembako', `Menghapus data sembako penerima ${target.namaLengkap} (${target.nomorAnggota}).`);
    }
  };

  // VEHICLE HANDLERS
  const handleAddVehicleLog = async (newLog: VehicleLog) => {
    const updated = [newLog, ...vehicleLogs];
    setVehicleLogs(updated);
    setStoredVehicles(updated);
    await saveFirestoreDoc('vehicleLogs', newLog);
    await createLog('Kendaraan', 'Catat Pemakaian Kendaraan', `Mencatat jurnal ${newLog.nomorLog} untuk ${newLog.kendaraan} (${newLog.platNomor}) oleh ${newLog.namaPemakai}.`);
  };

  const handleUpdateVehicleLog = async (updatedLog: VehicleLog) => {
    const updated = vehicleLogs.map(v => v.id === updatedLog.id ? updatedLog : v);
    setVehicleLogs(updated);
    setStoredVehicles(updated);
    await saveFirestoreDoc('vehicleLogs', updatedLog);
    await createLog('Kendaraan', 'Update Pemakaian Kendaraan', `Memperbarui jurnal ${updatedLog.nomorLog} (${updatedLog.kendaraan}) status: ${updatedLog.status}.`);
  };

  const handleDeleteVehicleLog = async (id: string) => {
    const target = vehicleLogs.find(v => v.id === id);
    const updated = vehicleLogs.filter(v => v.id !== id);
    setVehicleLogs(updated);
    setStoredVehicles(updated);
    await deleteFirestoreDoc('vehicleLogs', id);
    if (target) {
      await createLog('Kendaraan', 'Hapus Jurnal Kendaraan', `Menghapus jurnal ${target.nomorLog} (${target.kendaraan}).`);
    }
  };

  // FINANCE HANDLERS
  const handleSaveFinanceRecord = async (newOrUpdated: FinanceDailyRecord) => {
    const existingIdx = financeRecords.findIndex(f => f.id === newOrUpdated.id || f.tanggal === newOrUpdated.tanggal);
    let updatedList: FinanceDailyRecord[] = [];
    if (existingIdx >= 0) {
      updatedList = [...financeRecords];
      updatedList[existingIdx] = newOrUpdated;
    } else {
      updatedList = [newOrUpdated, ...financeRecords];
    }

    setFinanceRecords(updatedList);
    setStoredFinance(updatedList);
    await saveFirestoreDoc('financeRecords', newOrUpdated);
    await createLog('Keuangan', 'Update Kas Keuangan', `Catatan kas tanggal ${newOrUpdated.tanggal}, COS Masuk: Rp ${newOrUpdated.uangCosMasuk.toLocaleString('id-ID')}, Items Pengeluaran: ${newOrUpdated.pengeluaranItems.length}.`);
  };

  const handleDeleteFinanceRecord = async (id: string) => {
    const target = financeRecords.find(f => f.id === id);
    const updatedList = financeRecords.filter(f => f.id !== id);
    setFinanceRecords(updatedList);
    setStoredFinance(updatedList);
    await deleteFirestoreDoc('financeRecords', id);
    if (target) {
      await createLog('Keuangan', 'Hapus Transaksi Kas', `Menghapus catatan kas tanggal ${target.tanggal}.`);
    }
  };

  // USER MANAGEMENT HANDLERS
  const handleAddUser = async (newUsr: UserAccount) => {
    const updated = [newUsr, ...users];
    setUsers(updated);
    setStoredUsers(updated);
    await saveFirestoreDoc('users', newUsr);
    await createLog('Sistem', 'Tambah User Pengurus', `Menambahkan akun pengurus baru ${newUsr.name} (${newUsr.role}).`);
  };

  const handleUpdateUser = async (updatedUsr: UserAccount) => {
    const updated = users.map(u => u.id === updatedUsr.id ? updatedUsr : u);
    setUsers(updated);
    setStoredUsers(updated);
    await saveFirestoreDoc('users', updatedUsr);
    if (currentUser.id === updatedUsr.id) {
      setCurrentUserAccount(updatedUsr);
      setCurrentUser(updatedUsr);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    setStoredUsers(updated);
    await deleteFirestoreDoc('users', userId);
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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      
      {/* Top Fixed Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={auditLogs.length}
        onLogout={handleLogout}
      />

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
      <main className={isMobilePreview ? "p-2 sm:p-4" : "p-3 sm:p-6 lg:p-8"}>
        <div className={isMobilePreview ? 'max-w-md mx-auto border-[6px] sm:border-[10px] border-slate-800 rounded-[32px] sm:rounded-[40px] shadow-2xl bg-slate-950 p-3 sm:p-5 ring-1 ring-slate-700/60 my-2 overflow-x-hidden' : 'max-w-7xl mx-auto'}>
          
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
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewCase={() => setActiveTab('advocacy')}
              onOpenNewSickVisit={() => setActiveTab('sick_visits')}
              onOpenNewAgenda={() => setActiveTab('agendas')}
            />
          )}

          {/* Menu 1: Data Anggota */}
          {activeTab === 'members' && (
            <MembersModule
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onImportMembers={handleImportMembers}
              onOpenCardModal={(mbr) => setSelectedCardMember(mbr)}
              currentUser={currentUser}
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

          {/* Menu 4: Agenda Organisasi */}
          {activeTab === 'agendas' && (
            <AgendaModule
              agendas={agendas}
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
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-white">Akses Dibatasi (Super Admin Only)</h2>
                <p className="text-xs text-slate-400">
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
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                <h2 className="text-lg font-black text-white">Akses Dibatasi</h2>
                <p className="text-xs text-slate-400">Menu ini khusus untuk akun Super Admin SBN KASBI.</p>
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
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 my-10 max-w-lg mx-auto">
                <h2 className="text-lg font-black text-white">Akses Dibatasi</h2>
                <p className="text-xs text-slate-400">Menu Pengaturan & Audit System khusus untuk akun Super Admin.</p>
              </div>
            )
          )}

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
          auditLogs={auditLogs}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

    </div>
  );
}
