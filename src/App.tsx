import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { HomeSection } from './components/HomeSection';
import { UploadSection } from './components/UploadSection';
import { SavedPortfolio } from './components/SavedPortfolio';
import { MarketBenchmarkView } from './components/MarketBenchmarkView';
import { ContractorsDirectory } from './components/ContractorsDirectory';
import { PropertyAnalysisModal } from './components/PropertyAnalysisModal';
import { PropertyMediaModal } from './components/PropertyMediaModal';
import { TutorialVideoModal } from './components/TutorialVideoModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { PropertyItem } from './types/property';
import { TeamData } from './types/team';
import {
  initAuth,
  googleSignIn,
  logout,
} from './services/firebase';
import {
  getOrCreateUserSpreadsheet,
  fetchPropertiesFromSheet,
  appendPropertiesToSheet,
  updatePropertyInSheet,
  deletePropertyFromSheet,
  uploadAndAddMediaToProperty,
  deleteMediaFromProperty,
  setCoverMediaForProperty,
  UserSpreadsheetMeta,
} from './services/googleSheets';
import { uploadImageToDrive, getOrCreateImagesFolder } from './services/googleDrive';
import { saveImageToLocalCache } from './services/imageStorage';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

// Sample demonstration properties for initial investor preview with Google Maps coordinates
const INITIAL_DEMO_PROPERTIES: PropertyItem[] = [
  {
    id: 'demo-1',
    propertyType: 'บ้านเดี่ยว',
    country: 'ไทย',
    province: 'นนทบุรี',
    district: 'บางกรวย',
    subDistrict: 'มหาสวัสดิ์',
    village: 'ม.มัณฑนา ราชพฤกษ์',
    houseNumber: '88/142',
    mapLink: 'https://maps.google.com/?q=13.8048,100.4526',
    latitude: 13.8048,
    longitude: 100.4526,
    price: 6500000,
    rentalPrice: 35000,
    appraisedPrice: 7200000,
    areaSize: 72,
    pricePerSqWa: 90278,
    contactNumber: '081-998-7744',
    highlights: 'บ้านเดี่ยว 2 ชั้น หลังมุม สวนกว้าง ใกล้ The Crystal SB ราชพฤกษ์ กู้ได้เกินราคาขาย',
    dateAdded: '27/09/2026',
  },
  {
    id: 'demo-2',
    propertyType: 'ทาวน์โฮม/ทาวน์เฮ้าส์',
    country: 'ไทย',
    province: 'กรุงเทพมหานคร',
    district: 'ประเวศ',
    subDistrict: 'ดอกไม้',
    village: 'โกลเด้น นีโอ บางนา-กิ่งแก้ว',
    houseNumber: '19/55',
    mapLink: 'https://maps.google.com/?q=13.6738,100.6978',
    latitude: 13.6738,
    longitude: 100.6978,
    price: 3800000,
    rentalPrice: 22000,
    appraisedPrice: 4200000,
    areaSize: 36,
    pricePerSqWa: 105556,
    contactNumber: '086-554-1122',
    highlights: 'ทาวน์โฮมสไตล์อังกฤษ 4 ห้องนอน ทำเลเชื่อมต่อเมกาบางนาและสนามบินสุวรรณภูมิ',
    dateAdded: '27/09/2026',
  },
  {
    id: 'demo-3',
    propertyType: 'คอนโดมิเนียม',
    country: 'ไทย',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    subDistrict: 'คลองตันเหนือ',
    village: 'The Monument Thong Lo (ทองหล่อ)',
    houseNumber: '99/8',
    mapLink: 'https://maps.google.com/?q=13.7335,100.5828',
    latitude: 13.7335,
    longitude: 100.5828,
    price: 18500000,
    rentalPrice: 75000,
    appraisedPrice: 21000000,
    areaSize: 32,
    pricePerSqWa: 578125,
    contactNumber: '089-771-4433',
    highlights: 'คอนโด Luxury กลางทองหล่อ ผลตอบแทนค่าเช่าสูง วิวมุมสูง 360 องศา ใกล้ BTS ทองหล่อ',
    dateAdded: '28/09/2026',
  },
];

export default function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [spreadsheetMeta, setSpreadsheetMeta] = useState<UserSpreadsheetMeta | null>(null);
  const [properties, setProperties] = useState<PropertyItem[]>(INITIAL_DEMO_PROPERTIES);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'portfolio' | 'market' | 'contractors'>('home');
  const [selectedPropertyForAnalysis, setSelectedPropertyForAnalysis] = useState<PropertyItem | null>(null);
  const [selectedPropertyForMedia, setSelectedPropertyForMedia] = useState<PropertyItem | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Load Team Data (Stripe Per-Seat, Members & Shared Quota)
  const loadTeamData = useCallback(async () => {
    try {
      const res = await fetch('/api/team/info');
      const data = await res.json();
      if (data.success && data.team) {
        setTeam(data.team);
      }
    } catch (err) {
      console.warn('Failed to load team data:', err);
    }
  }, []);

  useEffect(() => {
    loadTeamData();

    // Check billing_success, billing_canceled, or vip_unlimited redirect from Stripe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('vip_unlimited') === 'true') {
      showNotification(t('vipWelcomeMessage', '👑 ยินดีต้อนรับ Owner VIP! บัญชี kerdphon.posea@gmail.com ได้รับสิทธิ์ใช้งานได้ไม่จำกัดตลอดชีพ'));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('billing_success') === 'true') {
      const plan = (urlParams.get('plan') as 'FREE' | 'STANDARD' | 'PRO') || 'PRO';
      const sessionId = urlParams.get('session_id');

      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planTier: plan,
          email: user?.email || urlParams.get('email') || undefined,
        }),
      })
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.team) {
            setTeam(d.team);
            showNotification(
              d.message ||
                `${t('stripePaymentSuccess', 'การชำระเงินผ่าน Stripe สำเร็จ!')} ${t('planTierLabel', 'แพ็กเกจ')} ${d.team.billing.planName} ${t('quotaMonthlyLabel', 'โควตา')} ${d.team.quota.totalQuota} ${t('timesPerMonth', 'ครั้ง/เดือน')} ${t('readyToUseNow', 'พร้อมใช้งานทันที')}`
            );
          }
        })
        .catch(console.warn);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('billing_canceled') === 'true') {
      showNotification(t('billingCancelledNotice', 'การชำระเงินถูกยกเลิก คุณสามารถเลือกแพ็กเกจที่ต้องการใหม่ได้ทุกเมื่อ'), 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadTeamData, t]);

  // Handle Add Member (Calls Stripe subscriptions.update +1 seat, quota +100)
  const handleAddTeamMember = async (name: string, email: string) => {
    const res = await fetch('/api/team/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to add team member');
    }
    setTeam(data.team);
    showNotification(data.message || t('addMemberSuccess', 'เพิ่มลูกทีมสำเร็จ'));
  };

  // Handle Remove Member (Calls Stripe subscriptions.update -1 seat, quota -100)
  const handleRemoveTeamMember = async (memberId: string) => {
    const res = await fetch('/api/team/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to remove member');
    }
    setTeam(data.team);
    showNotification(data.message || t('removeMemberSuccess', 'ลบลูกทีมสำเร็จ'));
  };

  // Handle Switch User (Role Simulator between Admin and Member)
  const handleSwitchTeamUser = async (userId: string) => {
    const res = await fetch('/api/team/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to switch user');
    }
    setTeam(data.team);
    showNotification(`${t('switchedViewTo', 'สลับมุมมองเป็น:')} ${data.team.activeUserName} (${data.team.activeUserRole})`);
  };

  // Handle Plan Tier Selection (FREE, STANDARD, PRO)
  const handleSelectPlan = async (tier: 'FREE' | 'STANDARD' | 'PRO') => {
    // Require Gmail login for ALL packages
    if (!user) {
      showNotification(t('requireLoginGmailBeforePlan', 'กรุณาเข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัครสมาชิกทุกแพ็กเกจ'), 'error');
      handleLogin();
      return;
    }

    const res = await fetch('/api/workspace/select-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planTier: tier, email: user.email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to select plan');
    }
    setTeam(data.team);
    showNotification(`${t('changedToPlanSuccess', 'เปลี่ยนเป็นแพ็กเกจ')} ${data.team.billing.planName} ${t('successfully', 'เรียบร้อยแล้ว')} ${t('quotaMonthlyLabel', 'โควตา')} ${data.team.quota.totalQuota} ${t('timesPerMonth', 'ครั้ง/เดือน')}`);
  };

  // Load properties from Google Sheet
  const loadUserSheetData = useCallback(async (accessToken: string) => {
    setIsLoadingProperties(true);
    try {
      const meta = await getOrCreateUserSpreadsheet(accessToken);
      setSpreadsheetMeta(meta);

      // Sync Google Sheet ID with Workspace backend
      if (meta?.id) {
        fetch('/api/team/update-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetId: meta.id, sheetUrl: meta.webViewLink }),
        })
          .then((res) => res.json())
          .then((d) => {
            if (d.success && d.team) setTeam(d.team);
          })
          .catch((e) => console.warn('Workspace sheet sync warning:', e));
      }

      const items = await fetchPropertiesFromSheet(meta.id, accessToken);
      // Deduplicate items by ID
      const seenIds = new Set<string>();
      const uniqueItems: PropertyItem[] = [];
      for (const it of items) {
        if (!seenIds.has(it.id)) {
          seenIds.add(it.id);
          uniqueItems.push(it);
        }
      }
      setProperties(uniqueItems);
    } catch (err: any) {
      console.error('Error loading Google Sheet data:', err);
      showNotification(err.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้', 'error');
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);

        // Sync authenticated user with Workspace backend
        if (authUser?.email) {
          fetch('/api/workspace/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authUser.email,
              name: authUser.displayName || authUser.email.split('@')[0],
              uid: authUser.uid,
            }),
          })
            .then((res) => res.json())
            .then((d) => {
              if (d.success && d.team) {
                setTeam(d.team);
              }
            })
            .catch((e) => console.warn('Workspace user sync warning:', e));
        }

        if (authToken) {
          loadUserSheetData(authToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setSpreadsheetMeta(null);
      }
    );

    return () => unsubscribe();
  }, [loadUserSheetData]);

  // Google Login Handler
  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showNotification(`${t('loginSuccessAs', 'เข้าสู่ระบบสำเร็จในชื่อ')} ${result.user.displayName || result.user.email}`);
        await loadUserSheetData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showNotification(err.message || t('loginErrorTryAgain', 'การเข้าสู่ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง'), 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetMeta(null);
      setProperties(INITIAL_DEMO_PROPERTIES);

      // Reset backend workspace session
      try {
        const res = await fetch('/api/workspace/logout', { method: 'POST' });
        const d = await res.json();
        if (d.success && d.team) {
          setTeam(d.team);
        }
      } catch (logoutErr) {
        console.warn('Workspace logout notice:', logoutErr);
      }

      showNotification(t('loggedOutSuccess', 'ออกจากระบบเรียบร้อยแล้ว'));
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Save extracted properties to Google Sheet
  const handleSaveToSheet = async (newItems: PropertyItem[]) => {
    if (!token) {
      showNotification(t('loginPromptSheet', 'กรุณาเข้าสู่ระบบด้วย Gmail เพื่อเชื่อมต่อ Google Sheet'), 'error');
      handleLogin();
      return;
    }

    // 1. Check & Consume Shared Team Quota
    try {
      const quotaRes = await fetch('/api/team/consume-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newItems.length }),
      });
      const quotaData = await quotaRes.json();
      if (!quotaRes.ok || !quotaData.success) {
        showNotification(quotaData.error || t('teamQuotaDepletedNotice', 'โควตากลางของทีมหมดแล้ว กรุณาติดต่อ Admin เพื่อเพิ่ม Seat สมาชิก (+100 รูป/ที่นั่ง)'), 'error');
        setIsTeamModalOpen(true);
        return;
      }
      if (quotaData.team) {
        setTeam(quotaData.team);
      }
    } catch (qErr) {
      console.warn('Team quota check note:', qErr);
    }

    try {
      let sheetId = spreadsheetMeta?.id;
      if (!sheetId) {
        const meta = await getOrCreateUserSpreadsheet(token);
        setSpreadsheetMeta(meta);
        sheetId = meta.id;
      }

      // Sync Admin's Google Sheet ID to Team record
      if (sheetId && spreadsheetMeta?.webViewLink) {
        fetch('/api/team/update-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetId,
            sheetUrl: spreadsheetMeta.webViewLink,
          }),
        }).catch((e) => console.warn('Sync sheet to team note:', e));
      }

      // Tag items with the active recorder's name/role
      const activeUploader = team?.activeUserName
        ? `${team.activeUserName} (${team.activeUserRole})`
        : user?.displayName || 'Admin';

      const itemsWithUploader = newItems.map((item) => ({
        ...item,
        uploaderName: activeUploader,
      }));

      await appendPropertiesToSheet(sheetId, token, itemsWithUploader);
      // Reload properties directly from Google Sheet to ensure sheetRowIndex and media files are strictly synced
      await loadUserSheetData(token);
      showNotification(`${t('savedCountToSheetSuccess', 'บันทึกข้อมูล')} ${newItems.length} ${t('itemsUnit', 'รายการ')}${t('toGoogleSheetSuccess', 'ลง Google Sheet สำเร็จ!')} (${t('recorderLabel', 'ผู้บันทึก:')} ${activeUploader}) ${t('canAddMediaHint', 'สามารถกด "+ สื่อ" เพื่อเพิ่มรูปและวิดีโอได้สูงสุด 10 ไฟล์ต่อทรัพย์')}`);
      setActiveTab('portfolio');
    } catch (err: any) {
      console.error('Error saving to sheet:', err);
      showNotification(err.message || t('saveToSheetFailed', 'บันทึกลง Google Sheet ไม่สำเร็จ'), 'error');
      throw err;
    }
  };

  // Update property in Google Sheet
  const handleUpdateProperty = async (updated: PropertyItem) => {
    if (!token || !spreadsheetMeta) {
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) {
        setSelectedPropertyForAnalysis(updated);
      }
      showNotification(t('updatePreviewSuccess', 'อัปเดตข้อมูลสำเร็จ (โหมดดูตัวอย่าง)'));
      return;
    }

    try {
      await updatePropertyInSheet(spreadsheetMeta.id, token, updated);
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) {
        setSelectedPropertyForAnalysis(updated);
      }
      showNotification(t('updateSheetSuccess', 'อัปเดตข้อมูลใน Google Sheet สำเร็จ'));
    } catch (err: any) {
      console.error('Error updating property:', err);
      showNotification(err.message || t('updateSheetFailed', 'อัปเดตข้อมูลไม่สำเร็จ'), 'error');
      throw err;
    }
  };

  // Delete property from Google Sheet
  const handleDeleteProperty = async (target: PropertyItem) => {
    if (!token || !spreadsheetMeta) {
      setProperties((prev) => prev.filter((p) => p.id !== target.id));
      showNotification(t('deleteItemSuccess', 'ลบข้อมูลออกจากรายการเรียบร้อยแล้ว'));
      return;
    }

    try {
      if (target.sheetRowIndex) {
        await deletePropertyFromSheet(spreadsheetMeta.id, token, target.sheetRowIndex);
      }
      setProperties((prev) => prev.filter((p) => p.id !== target.id));
      showNotification(t('deleteSheetSuccess', 'ลบข้อมูลออกจาก Google Sheet เรียบร้อยแล้ว'));
    } catch (err: any) {
      console.error('Error deleting property:', err);
      showNotification(err.message || t('deleteSheetFailed', 'ลบข้อมูลไม่สำเร็จ'), 'error');
      throw err;
    }
  };

  // Upload image handler
  const handleUploadImageForProperty = async (property: PropertyItem, file: File): Promise<void> => {
    if (token) {
      await handleUploadPropertyMedia(property, [file], true);
      return;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          saveImageToLocalCache(`prop_${property.id}`, base64Data);

          const updatedProperty: PropertyItem = {
            ...property,
            image: base64Data,
            mediaFiles: [
              {
                id: `media_${Date.now()}`,
                url: base64Data,
                type: 'image',
                fileName: file.name,
                isCover: true,
                dateAdded: new Date().toLocaleDateString('th-TH'),
              },
              ...(property.mediaFiles || []).map(m => ({ ...m, isCover: false })),
            ],
          };

          setProperties((prev) => prev.map((p) => (p.id === property.id ? updatedProperty : p)));
          if (selectedPropertyForAnalysis?.id === property.id) {
            setSelectedPropertyForAnalysis(updatedProperty);
          }

          showNotification(t('saveImageSuccess', 'บันทึกรูปภาพเรียบร้อยแล้ว'));
          resolve();
        } catch (err: any) {
          showNotification(err.message || t('saveImageFailed', 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ'), 'error');
          reject(err);
        }
      };

      reader.onerror = () => {
        showNotification(t('cannotReadImageFile', 'ไม่สามารถอ่านไฟล์รูปภาพได้'), 'error');
        reject(new Error(t('cannotReadImageFile', 'ไม่สามารถอ่านไฟล์รูปภาพได้')));
      };

      reader.readAsDataURL(file);
    });
  };

  // Upload and attach multiple media files (photos / videos, up to 10) to a property
  const handleUploadPropertyMedia = async (
    property: PropertyItem,
    files: File[],
    asCover: boolean = false,
    onProgress?: (current: number, total: number, fileName: string) => void
  ) => {
    if (!token) {
      showNotification(t('loginGoogleToUploadMedia', 'กรุณาเข้าสู่ระบบ Google เพื่ออัปโหลดสื่อ'), 'error');
      handleLogin();
      return;
    }

    let sheetId = spreadsheetMeta?.id;
    if (!sheetId) {
      const meta = await getOrCreateUserSpreadsheet(token);
      setSpreadsheetMeta(meta);
      sheetId = meta.id;
    }

    try {
      const updated = await uploadAndAddMediaToProperty(sheetId, token, property, files, onProgress, asCover);
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) {
        setSelectedPropertyForAnalysis(updated);
      }
      if (selectedPropertyForMedia?.id === updated.id) {
        setSelectedPropertyForMedia(updated);
      }
      showNotification(`${t('uploadMediaSuccessMsg', 'อัปโหลดและบันทึกรูป/วิดีโอลง Google Sheet สำเร็จ')} (${updated.mediaFiles?.length || 0}/10 ${t('filesCountLabel', 'ไฟล์')})`);
    } catch (err: any) {
      console.error('Error uploading property media:', err);
      showNotification(err.message || t('uploadMediaFailed', 'ไม่สามารถอัปโหลดไฟล์สื่อได้'), 'error');
      throw err;
    }
  };

  // Delete a media item from property
  const handleDeletePropertyMedia = async (property: PropertyItem, mediaId: string) => {
    if (!token || !spreadsheetMeta) {
      const currentMedia = property.mediaFiles || [];
      const filtered = currentMedia.filter((m) => m.id !== mediaId);
      const updated = { ...property, mediaFiles: filtered };
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) setSelectedPropertyForAnalysis(updated);
      if (selectedPropertyForMedia?.id === updated.id) setSelectedPropertyForMedia(updated);
      showNotification(t('mediaDeletedSuccess', 'ลบไฟล์สื่อเรียบร้อยแล้ว'));
      return;
    }

    try {
      const updated = await deleteMediaFromProperty(spreadsheetMeta.id, token, property, mediaId);
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) setSelectedPropertyForAnalysis(updated);
      if (selectedPropertyForMedia?.id === updated.id) setSelectedPropertyForMedia(updated);
      showNotification(t('mediaDeleteAndSheetUpdated', 'ลบไฟล์สื่อและอัปเดต Google Sheet เรียบร้อยแล้ว'));
    } catch (err: any) {
      console.error('Error deleting media:', err);
      showNotification(err.message || t('deleteMediaFailed', 'ลบไฟล์สื่อไม่สำเร็จ'), 'error');
      throw err;
    }
  };

  // Set a media item as primary cover photo
  const handleSetCoverMedia = async (property: PropertyItem, mediaId: string) => {
    if (!token || !spreadsheetMeta) {
      const currentMedia = property.mediaFiles || [];
      const updatedMedia = currentMedia.map((m) => ({ ...m, isCover: m.id === mediaId }));
      const coverItem = updatedMedia.find((m) => m.id === mediaId);
      const updated = { ...property, mediaFiles: updatedMedia, image: coverItem?.url || property.image };
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) setSelectedPropertyForAnalysis(updated);
      if (selectedPropertyForMedia?.id === updated.id) setSelectedPropertyForMedia(updated);
      showNotification(t('setCoverPhotoSuccess', 'ตั้งเป็นรูปหน้าปกหลักเรียบร้อยแล้ว'));
      return;
    }

    try {
      const updated = await setCoverMediaForProperty(spreadsheetMeta.id, token, property, mediaId);
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPropertyForAnalysis?.id === updated.id) setSelectedPropertyForAnalysis(updated);
      if (selectedPropertyForMedia?.id === updated.id) setSelectedPropertyForMedia(updated);
      showNotification(t('setCoverPhotoAndSheetUpdated', 'ตั้งเป็นรูปหน้าปกและบันทึก Google Sheet สำเร็จ'));
    } catch (err: any) {
      console.error('Error setting cover media:', err);
      showNotification(err.message || t('setCoverPhotoFailed', 'ไม่สามารถตั้งเป็นรูปหน้าปกได้'), 'error');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-warm-linen font-sans text-[#24211D] flex flex-col selection:bg-[#C86A39] selection:text-white relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-luxe-lg border text-sm font-medium animate-in slide-in-from-top-4 duration-200 backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-white text-[#2E7D32] border-[#C8E6C9]'
              : 'bg-white text-[#C62828] border-[#FFCDD2]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#C62828] shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={user}
        spreadsheetMeta={spreadsheetMeta}
        activeTab={activeTab}
        portfolioCount={properties.length}
        isLoggingIn={isLoggingIn}
        onTabChange={setActiveTab}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        team={team}
        onOpenTeam={() => setIsTeamModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 sm:pb-8">
        {activeTab === 'home' && (
          <HomeSection
            user={user}
            team={team}
            onNavigateToScan={() => setActiveTab('scan')}
            onOpenAnalysis={(item) => setSelectedPropertyForAnalysis(item)}
            onOpenTeam={() => setIsTeamModalOpen(true)}
            demoProperties={properties.slice(0, 3)}
            onShowNotification={showNotification}
          />
        )}

        {activeTab === 'scan' && (
          <UploadSection
            user={user}
            token={token}
            hasSpreadsheet={!!spreadsheetMeta}
            spreadsheetUrl={spreadsheetMeta?.webViewLink}
            onSaveToSheet={handleSaveToSheet}
            onLogin={handleLogin}
            onOpenAnalysis={(item) => setSelectedPropertyForAnalysis(item)}
            team={team}
            onOpenTeam={() => setIsTeamModalOpen(true)}
            onShowNotification={showNotification}
          />
        )}

        {activeTab === 'portfolio' && (
          <SavedPortfolio
            properties={properties}
            isLoading={isLoadingProperties}
            spreadsheetMeta={spreadsheetMeta}
            onRefresh={() => token && loadUserSheetData(token)}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
            onOpenAnalysis={(item) => setSelectedPropertyForAnalysis(item)}
            onOpenMedia={(item) => setSelectedPropertyForMedia(item)}
            onUploadImage={handleUploadImageForProperty}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        )}

        {activeTab === 'market' && <MarketBenchmarkView />}

        {activeTab === 'contractors' && <ContractorsDirectory />}
      </main>

      {/* Property Investment Analysis Modal */}
      <PropertyAnalysisModal
        property={selectedPropertyForAnalysis}
        isOpen={!!selectedPropertyForAnalysis}
        onClose={() => setSelectedPropertyForAnalysis(null)}
        onUpdateProperty={handleUpdateProperty}
        onUploadImage={handleUploadImageForProperty}
        onOpenMedia={(item) => setSelectedPropertyForMedia(item)}
      />

      {/* Property Photos & Videos Media Modal (Up to 10 files per property) */}
      <PropertyMediaModal
        property={selectedPropertyForMedia}
        isOpen={!!selectedPropertyForMedia}
        onClose={() => setSelectedPropertyForMedia(null)}
        onUploadMedia={handleUploadPropertyMedia}
        onDeleteMedia={handleDeletePropertyMedia}
        onSetCoverMedia={handleSetCoverMedia}
        token={token}
      />

      {/* Official Tutorial Video Modal (YouTube: rZTBIqm2iBI) */}
      <TutorialVideoModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Team Collaboration & Per-Seat Stripe Billing Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        team={team}
        onAddMember={handleAddTeamMember}
        onRemoveMember={handleRemoveTeamMember}
        onSwitchUser={handleSwitchTeamUser}
        onSelectPlan={handleSelectPlan}
        user={user}
        onLogin={handleLogin}
      />

      {/* Warm Timber Architectural Footer */}
      <footer className="bg-[#2D221B] text-[#D4C8B8] py-10 mt-16 border-t border-[#3D3027]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-editorial text-xl text-white font-bold tracking-tight">
              {t('brandName', 'PropStudio')}
            </h3>
            <p className="text-xs text-[#A89A8A]">
              {t('footerDesc', 'ระบบดึงข้อมูลและวิเคราะห์การลงทุนอสังหาริมทรัพย์ระดับพรีเมียม')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#A89A8A]">
            <span>{t('footerSyncDrive', 'Google Sheets & Drive V3 Connected')}</span>
            <span>·</span>
            <span>{t('footerVisionOcr', 'Gemini 2.5 Vision OCR Engine')}</span>
            <span>·</span>
            <span>{t('footerContractorVetted', 'ระบบคัดกรองผู้รับเหมาคุณภาพ 5 บริษัทการันตี')}</span>
          </div>

          <div className="text-xs text-[#8A7C6E]">
            {t('copyright', '© 2026 PropStudio. All rights reserved.')}
          </div>
        </div>
      </footer>
    </div>
  );
}
