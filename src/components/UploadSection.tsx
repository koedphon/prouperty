import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Sparkles,
  Phone,
  AlertCircle,
  ExternalLink,
  Zap,
  Crown,
} from 'lucide-react';
import { PropertyItem, PropertyMediaItem } from '../types/property';
import { User } from 'firebase/auth';
import { saveImageToLocalCache, updatePropertyImageCache } from '../services/imageStorage';
import { uploadImageToDrive, getOrCreateImagesFolder } from '../services/googleDrive';
import { PropertyImage } from './PropertyImage';
import { useLanguage } from '../i18n/LanguageContext';
import { TeamData } from '../types/team';
import { isUnlimitedVipUser } from '../utils/vip';

interface UploadSectionProps {
  user: User | null;
  token?: string | null;
  hasSpreadsheet: boolean;
  spreadsheetUrl?: string;
  onSaveToSheet: (items: PropertyItem[]) => Promise<void>;
  onLogin: () => void;
  onOpenAnalysis: (item: PropertyItem) => void;
  team?: TeamData | null;
  onOpenTeam?: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  user,
  token,
  hasSpreadsheet,
  spreadsheetUrl,
  onSaveToSheet,
  onLogin,
  onOpenAnalysis,
  team,
  onOpenTeam,
  onShowNotification,
}) => {
  const { t } = useLanguage();
  const [extractedList, setExtractedList] = useState<PropertyItem[]>([]);
  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    current: number;
    total: number;
    statusText?: string;
    currentPreview: string | null;
  }>({
    isProcessing: false,
    current: 0,
    total: 0,
    currentPreview: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload handler with Gemini OCR + Direct Drive Upload + Auto-Save
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    // Check Gmail login requirement for all packages
    if (!user) {
      if (onShowNotification) {
        onShowNotification(t('loginGmailPrompt', 'กรุณาเข้าสู่ระบบด้วยบัญชี Gmail ก่อนใช้งาน (ทุกแพ็กเกจต้องผูกกับบัญชี Gmail)'), 'error');
      }
      if (onLogin) onLogin();
      return;
    }

    // Check Quota (Skip for Owner Unlimited VIP: kerdphon.posea@gmail.com is the ONLY unlimited account)
    const isVip = isUnlimitedVipUser(user?.email);
    if (!isVip && team && team.quota.remainingQuota <= 0) {
      if (onShowNotification) {
        onShowNotification(
          t('quotaExceededUpgradePrompt', 'โควตาการบันทึกและวิเคราะห์ด้วย AI ประจำเดือนของคุณหมดแล้ว กรุณาอัปเกรดแพ็กเกจ Standard หรือ Pro'),
          'error'
        );
      }
      if (onOpenTeam) onOpenTeam();
      return;
    }

    setProcessingState({
      isProcessing: true,
      current: 0,
      total: fileArray.length,
      statusText: t('preparingImageText', 'กำลังเตรียมรูปภาพและอ่านข้อมูล...'),
      currentPreview: null,
    });

    const newExtracted: PropertyItem[] = [];

    // Pre-resolve Drive folder if signed in
    let driveFolderId: string | null = null;
    if (token) {
      try {
        driveFolderId = await getOrCreateImagesFolder(token);
      } catch (fErr) {
        console.warn('Folder resolution note:', fErr);
      }
    }

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const base64Data = await readFileAsDataUrl(file);
        setProcessingState({
          isProcessing: true,
          current: i + 1,
          total: fileArray.length,
          statusText: `${t('extractingAiAndDriveText', 'กำลังสกัดข้อมูลด้วย AI และอัปโหลดไปยัง Google Drive...')} (${i + 1}/${fileArray.length})`,
          currentPreview: base64Data,
        });

        const itemId = `scan-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`;
        saveImageToLocalCache(`prop_${itemId}`, base64Data);

        const ocrPromise = fetch('/api/extract-property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Image: base64Data,
            mimeType: file.type,
          }),
        }).then(res => res.json());

        const drivePromise = token
          ? uploadImageToDrive(
              base64Data,
              `prop_img_${Date.now()}_${i}`,
              token,
              driveFolderId
            ).catch(err => {
              console.warn('Drive upload error:', err);
              return null;
            })
          : Promise.resolve(null);

        const [resData, uploadedDrive] = await Promise.all([ocrPromise, drivePromise]);

        const finalImage = uploadedDrive?.webViewLink || base64Data;
        await updatePropertyImageCache(itemId, base64Data, uploadedDrive?.fileId);

        const initialMedia: PropertyMediaItem[] = [
          {
            id: `media_${itemId}`,
            url: finalImage,
            fileId: uploadedDrive?.fileId,
            type: 'image',
            fileName: file.name || t('coverImageDefaultName', 'รูปภาพหน้าปก'),
            isCover: true,
            dateAdded: new Date().toLocaleDateString('th-TH'),
          },
        ];

        // Ensure item is always added with the uploaded photo, even if OCR returns a fallback
        const d = (resData && resData.success && resData.data) ? resData.data : {};
        const areaSize = parseFloat(d.areaSize) || 50;
        const price = parseFloat(d.price) || 0;
        const pricePerSqWa = areaSize > 0 && price > 0 ? Math.round(price / areaSize) : 0;

        const item: PropertyItem = {
          id: itemId,
          image: finalImage,
          mediaFiles: initialMedia,
          propertyType: d.propertyType || 'บ้านเดี่ยว',
          country: 'ไทย',
          province: d.province || 'กรุงเทพมหานคร',
          district: d.district || '',
          subDistrict: d.subDistrict || '',
          village: d.village || file.name.replace(/\.[^/.]+$/, '') || 'แปลงที่ดิน/บ้านพักอาศัย',
          houseNumber: d.houseNumber || '',
          mapLink: d.mapLink || '',
          price: price,
          rentalPrice: parseFloat(d.rentalPrice) || 0,
          appraisedPrice: parseFloat(d.appraisedPrice) || 0,
          areaSize: areaSize,
          pricePerSqWa: pricePerSqWa,
          contactNumber: d.contactNumber || '',
          highlights: d.highlights || 'สแกนจากรูปภาพป้ายประกาศ',
          ocrRawText: d.ocrRawText || '',
          dateAdded: new Date().toLocaleDateString('th-TH'),
        };

        newExtracted.push(item);
      } catch (err) {
        console.error('Failed to process image:', file.name, err);
      }
    }

    setExtractedList(prev => {
      const seenIds = new Set<string>();
      const combined = [...newExtracted, ...prev];
      return combined.filter(item => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      });
    });

    setProcessingState({
      isProcessing: false,
      current: 0,
      total: 0,
      currentPreview: null,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (id: string, field: keyof PropertyItem, value: any) => {
    setExtractedList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'price' || field === 'areaSize') {
            const p = parseFloat(updated.price as any) || 0;
            const a = parseFloat(updated.areaSize as any) || 0;
            updated.pricePerSqWa = a > 0 ? Math.round(p / a) : 0;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedList(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveAll = async () => {
    if (extractedList.length === 0) return;
    if (!user) {
      onLogin();
      return;
    }

    setIsSaving(true);
    try {
      await onSaveToSheet(extractedList);
      setExtractedList([]);
    } catch (err: any) {
      console.error('Save to Google Sheet error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => (num ? Number(num).toLocaleString() : '0');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Dedicated Optical OCR Sign Scanning Console */}
      <div id="upload-dropzone" className="bg-white rounded-3xl p-5 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C86A39]">
              {t('opticalOcrTitle', 'Optical OCR Vision Engine')}
            </span>
            <span className="text-xs text-[#8A847C]">
              {t('multiFileSupport', 'รองรับไฟล์ภาพหลายรายการ')}
            </span>
          </div>

          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#24211D] tracking-tight">
            {t('uploadBoxTitle', 'สแกนป้ายประกาศอสังหาริมทรัพย์')}
          </h2>

          <p className="text-xs sm:text-sm text-[#767067] leading-relaxed">
            {t('uploadBoxSubtitle', 'ถ่ายรูปหรืออัปโหลดป้ายขายบ้าน ที่ดิน คอนโด หรือโบรชัวร์โครงการ ระบบ AI จะอ่านข้อความ ราคา เบอร์โทร และตำแหน่งที่ตั้ง พร้อมบันทึกลง Google Sheet และ Google Drive ในบัญชี Gmail ของคุณอัตโนมัติ')}
          </p>
        </div>

        {/* Workspace & Shared Quota Status Bar */}
        {team && (
          <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                team.activeUserRole === 'ADMIN' ? 'bg-[#C86A39] text-white shadow-xs' : 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
              }`}>
                {team.activeUserRole === 'ADMIN' ? '👑' : '👷'}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#24211D]">{team.activeUserName}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                    team.activeUserRole === 'ADMIN' ? 'bg-[#F4EFEB] text-[#C86A39] border-[#EAE3D9]' : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                  }`}>
                    {team.activeUserRole}
                  </span>
                  <span className="text-[11px] text-[#767067]">· {team.name}</span>
                </div>
                <span className="text-[10px] text-[#767067] block truncate">
                  {team.activeUserRole === 'MEMBER'
                    ? t('memberRoleDesc', 'สิทธิ์ลูกทีม: ข้อมูลจะถูกบันทึกเข้า Google Sheet ของ Admin พร้อมลงชื่อผู้บันทึก')
                    : t('adminRoleDesc', 'สิทธิ์แอดมิน: บริหารจัดการที่นั่งและผูก Google Sheet')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {(() => {
                const isVip = isUnlimitedVipUser(user?.email);
                return (
                  <span className="text-[11px] font-bold text-[#C86A39] bg-white px-2.5 py-1 rounded-xl border border-[#EAE3D9] flex items-center gap-1 shadow-2xs">
                    <Zap className="w-3 h-3 text-[#C86A39]" />
                    <span>
                      {isVip
                        ? t('quotaUnlimitedVip', 'โควตา: ไม่จำกัด (Owner VIP ∞)')
                        : `${t('sharedQuotaLabel', 'โควตา')}: ${team.quota.remainingQuota}/${team.quota.totalQuota} ${t('unitTimes', 'ครั้ง')}`}
                    </span>
                  </span>
                );
              })()}

              {onOpenTeam && (
                <button
                  type="button"
                  onClick={onOpenTeam}
                  className="px-2.5 py-1 bg-white hover:bg-[#F4EFEB] active:scale-95 text-[#24211D] border border-[#EAE3D9] text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  title={t('registerBtn', 'ดูและเลือกแพ็กเกจสมาชิก')}
                >
                  <Crown className="w-3 h-3 text-[#C86A39]" />
                  <span>{t('homeCtaPlanBtn', 'แพ็กเกจสมาชิก')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Warm Sand Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          className="my-3 sm:my-4 rounded-2xl border-2 border-dashed border-[#D5C9B8] hover:border-[#C86A39] bg-[#FAF8F5] hover:bg-[#F5F1EB] transition-all p-6 sm:p-12 cursor-pointer flex flex-col items-center justify-center gap-3 sm:gap-4 group text-center"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-luxe-sm border border-[#EAE3D9] flex items-center justify-center text-[#C86A39] group-hover:scale-105 transition-transform">
            <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <p className="text-base sm:text-lg font-semibold text-[#24211D]">
              {t('dropzoneMain', 'คลิกเลือกภาพ หรือลากไฟล์มาวางที่นี่')}
            </p>
            <p className="text-xs text-[#8A847C] mt-1 font-sans">
              {t('dropzoneSub', 'JPG, PNG, WEBP (เลือกได้พร้อมกันหลายไฟล์)')}
            </p>
          </div>
        </div>

        {/* Ergonomic Action Buttons (Dual Large Camera & Gallery Buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Direct Mobile Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="btn-terracotta min-h-[52px] text-sm font-bold px-4 py-3.5 rounded-2xl shadow-luxe flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
          >
            <Camera className="w-5 h-5 shrink-0" />
            <span>{t('takePhoto', 'ถ่ายภาพด้วยกล้อง')}</span>
          </button>

          {/* Gallery / File Browse Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white hover:bg-[#F4EFEB] active:scale-[0.98] text-[#24211D] border border-[#EAE3D9] min-h-[52px] text-sm font-semibold px-4 py-3.5 rounded-2xl shadow-luxe-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Upload className="w-5 h-5 text-[#C86A39] shrink-0" />
            <span>{t('browseDevice', 'เลือกไฟล์จากอุปกรณ์')}</span>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Connection Status */}
        <div className="pt-2 border-t border-[#EAE3D9]">
          {user ? (
            <div className="flex items-center justify-between text-xs text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-[#2E7D32] shrink-0" />
                <span className="truncate">
                  {t('driveConnected', 'เชื่อมต่อ Drive เรียบร้อย')}: <strong>{user.email}</strong>
                </span>
              </div>
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1B5E20] hover:underline font-bold inline-flex items-center gap-1 ml-2 shrink-0"
                >
                  <span>{t('openSheets', 'เปิดชีต')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>{t('loginGoogle', 'ยังไม่ได้เข้าสู่ระบบ Google เพื่อเชื่อมต่อชีต')}</span>
              </div>
              <button
                onClick={onLogin}
                className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                {t('loginGoogle', 'เข้าสู่ระบบเลย')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Processing State Streamer */}
      {processingState.isProcessing && (
        <div className="bg-white p-5 rounded-2xl border border-[#EAE3D9] shadow-luxe flex items-center gap-4 animate-in fade-in duration-200">
          {processingState.currentPreview ? (
            <img
              src={processingState.currentPreview}
              alt="processing"
              className="w-16 h-16 object-cover rounded-xl border border-[#EAE3D9] shadow-xs shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center shrink-0">
              <Loader2 className="w-7 h-7 text-[#C86A39] animate-spin" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-semibold text-[#24211D]">
                {processingState.statusText || t('analyzingAi', 'AI กำลังอ่านข้อความและสกัดข้อมูล...')}
              </span>
              <span className="text-xs font-semibold text-[#C86A39] bg-[#F4EFEB] px-2.5 py-0.5 rounded-full">
                {processingState.current} / {processingState.total} {t('unitImages', 'รูป')}
              </span>
            </div>
            
            {/* Terracotta Progress Bar */}
            <div className="w-full bg-[#FAF8F5] rounded-full h-2 overflow-hidden border border-[#EAE3D9]">
              <div
                className="bg-[#C86A39] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(processingState.current / (processingState.total || 1)) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#8A847C] mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C86A39]" />
              <span>{t('step3Desc', 'ถอดข้อความป้าย คำนวณราคาต่อ ตร.ว. และบันทึกลง Google Drive อัตโนมัติ')}</span>
            </p>
          </div>
        </div>
      )}

      {/* Newly Extracted Items Staging Area */}
      {extractedList.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE3D9] shadow-luxe">
            <div>
              <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#24211D] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
                <span>{t('extractedHeading', 'รายการอสังหาริมทรัพย์ที่สกัดได้จากป้าย')} ({extractedList.length} {t('itemsCountUnit', 'รายการ')})</span>
              </h2>
              <p className="text-xs text-[#767067] mt-0.5">
                {t('reviewBeforeSave', 'ตรวจสอบและแก้ไขข้อมูลก่อนกดบันทึกลง Google Sheet')}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setExtractedList([])}
                className="px-3 py-2 text-xs font-semibold text-[#767067] hover:text-[#C86A39] rounded-xl transition-colors cursor-pointer"
              >
                {t('cleanAll', 'ล้างทั้งหมด')}
              </button>

              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="btn-terracotta flex-1 sm:flex-none flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 shadow-luxe-sm"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>
                  {isSaving
                    ? t('savingToSheetStatus', 'กำลังบันทึกลง Google Sheet...')
                    : user
                    ? t('saveToSheetWithCount', 'บันทึกลง Google Sheet')
                    : t('loginGoogle', 'เข้าสู่ระบบ Gmail เพื่อบันทึก')}
                </span>
              </button>
            </div>
          </div>

          {/* Cards of extracted items (Featured Collections style) */}
          <div className="grid grid-cols-1 gap-4">
            {extractedList.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="bg-white rounded-3xl p-5 border border-[#EAE3D9] shadow-luxe hover:border-[#C86A39]/60 transition-all relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Image preview */}
                  <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#EAE3D9] group shadow-xs">
                    <PropertyImage
                      imageUrl={item.image}
                      propertyId={item.id}
                      alt={item.village || item.propertyType || 'Property preview'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                      <button
                        onClick={() => {
                          if (item.image) setEnlargedImage(item.image);
                        }}
                        className="bg-white/90 hover:bg-white text-[#24211D] text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xs cursor-pointer"
                      >
                        {t('viewFullImage', 'ดูรูปเต็ม')}
                      </button>
                    </div>
                  </div>

                  {/* Form Details */}
                  <div className="flex-1 space-y-4">
                    {/* Top Row: Type & Title & Location */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                        <select
                          value={item.propertyType}
                          onChange={(e) => handleInputChange(item.id, 'propertyType', e.target.value)}
                          className="text-xs sm:text-xs font-semibold bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9] rounded-xl px-3 py-2.5 sm:py-1.5 outline-none min-h-[42px] sm:min-h-0 cursor-pointer"
                        >
                          <option value="บ้านเดี่ยว">{t('typeSingleHouse', 'บ้านเดี่ยว')}</option>
                          <option value="ทาวน์โฮม/ทาวน์เฮ้าส์">{t('typeTownhome', 'ทาวน์โฮม/ทาวน์เฮ้าส์')}</option>
                          <option value="คอนโดมิเนียม">{t('typeCondo', 'คอนโดมิเนียม')}</option>
                          <option value="อาคารพาณิชย์">{t('typeCommercial', 'อาคารพาณิชย์')}</option>
                          <option value="ที่ดินเปล่า">{t('typeLand', 'ที่ดินเปล่า')}</option>
                          <option value="โรงงาน/โกดัง">{t('typeFactory', 'โรงงาน/โกดัง')}</option>
                        </select>

                        {/* Responsive 3-Part Location Inputs (Equally balanced on mobile) */}
                        <div className="grid grid-cols-3 gap-1.5 flex-1 w-full">
                          <input
                            type="text"
                            placeholder={t('placeholderProvince', 'จังหวัด...')}
                            value={item.province}
                            onChange={(e) => handleInputChange(item.id, 'province', e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-2.5 py-2 text-xs text-[#24211D] font-semibold outline-none min-h-[42px] sm:min-h-0"
                          />
                          <input
                            type="text"
                            placeholder={t('placeholderDistrict', 'อำเภอ/เขต...')}
                            value={item.district}
                            onChange={(e) => handleInputChange(item.id, 'district', e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-2.5 py-2 text-xs text-[#24211D] outline-none min-h-[42px] sm:min-h-0"
                          />
                          <input
                            type="text"
                            placeholder={t('placeholderSubDistrict', 'ตำบล/แขวง...')}
                            value={item.subDistrict}
                            onChange={(e) => handleInputChange(item.id, 'subDistrict', e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-2.5 py-2 text-xs text-[#24211D] outline-none min-h-[42px] sm:min-h-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Village / Street / House Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#767067] block mb-0.5">{t('addressProjectLane', 'ชื่อโครงการ / ซอย / ถนน')}</label>
                        <input
                          type="text"
                          value={item.village}
                          onChange={(e) => handleInputChange(item.id, 'village', e.target.value)}
                          placeholder={t('addressProjectPlaceholder', 'เช่น ม.พฤกษา 12, ซ.รามอินทรา 65')}
                          className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs text-[#24211D] outline-none min-h-[42px] sm:min-h-0"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#767067] block mb-0.5">{t('houseNumberPlot', 'บ้านเลขที่ / แปลงเลขที่')}</label>
                        <input
                          type="text"
                          value={item.houseNumber}
                          onChange={(e) => handleInputChange(item.id, 'houseNumber', e.target.value)}
                          placeholder={t('houseNumberPlaceholder', 'เช่น 123/45')}
                          className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3 py-2.5 sm:py-1.5 text-sm sm:text-xs text-[#24211D] outline-none min-h-[42px] sm:min-h-0"
                        />
                      </div>
                    </div>

                    {/* Numeric Grid: Price, Area, Price/SqWa, Rental */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                        <span className="text-[10px] text-[#767067] block uppercase">{t('price', 'ราคาขาย')} ({t('baht', 'บาท')})</span>
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                          className="w-full bg-transparent text-base sm:text-sm font-bold text-[#C86A39] outline-none mt-0.5"
                          placeholder="0"
                        />
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                        <span className="text-[10px] text-[#767067] block uppercase">{t('areaSize', 'ขนาดที่ดิน (ตร.ว.)')}</span>
                        <input
                          type="number"
                          value={item.areaSize || ''}
                          onChange={(e) => handleInputChange(item.id, 'areaSize', e.target.value)}
                          className="w-full bg-transparent text-base sm:text-sm font-bold text-[#24211D] outline-none mt-0.5"
                          placeholder="0"
                        />
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                        <span className="text-[10px] text-[#767067] block uppercase">{t('pricePerSqWa', 'ราคาต่อ ตร.ว. (บาท)')}</span>
                        <span className="text-base sm:text-sm font-bold text-[#24211D] block mt-0.5">
                          ฿{formatNumber(item.pricePerSqWa || 0)}
                        </span>
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                        <span className="text-[10px] text-[#767067] block uppercase">{t('rentalPrice', 'ค่าเช่าคาดการณ์')} ({t('bahtPerMonth', 'บ./ด.')})</span>
                        <input
                          type="number"
                          value={item.rentalPrice || ''}
                          onChange={(e) => handleInputChange(item.id, 'rentalPrice', e.target.value)}
                          className="w-full bg-transparent text-base sm:text-sm font-bold text-[#2E7D32] outline-none mt-0.5"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Contact Phone & Highlights */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2.5 sm:py-2 min-h-[46px] sm:min-h-0 sm:w-auto">
                        <Phone className="w-4 h-4 text-[#C86A39] shrink-0" />
                        <input
                          type="text"
                          value={item.contactNumber}
                          onChange={(e) => handleInputChange(item.id, 'contactNumber', e.target.value)}
                          placeholder={t('contactNumberPlaceholder', 'เบอร์ติดต่อ...')}
                          className="bg-transparent text-base sm:text-xs text-[#24211D] outline-none w-full sm:w-28 font-medium"
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={item.highlights}
                          onChange={(e) => handleInputChange(item.id, 'highlights', e.target.value)}
                          placeholder={t('highlightsPlaceholder', 'จุดเด่นของทรัพย์ เช่น สภาพดี, พร้อมผู้เช่า, ราคาถูกกว่าตลาด...')}
                          className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-xs text-[#24211D] outline-none min-h-[46px] sm:min-h-0"
                        />
                      </div>
                    </div>

                    {/* Mobile-Friendly Item Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-[#F4EFEB]">
                      <button
                        type="button"
                        onClick={() => onOpenAnalysis(item)}
                        className="btn-terracotta min-h-[48px] sm:min-h-[38px] text-xs font-bold px-4 py-3 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-luxe-sm cursor-pointer active:scale-[0.98] transition-all flex-1 sm:flex-none"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{t('openAnalysis', 'วิเคราะห์การเงิน & สินเชื่อ AI')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExtractedList((prev) => prev.filter((p) => p.id !== item.id))}
                        className="p-2 sm:p-2 text-[#C62828] sm:text-[#767067] hover:text-[#C62828] bg-[#FFEBEE]/60 sm:bg-transparent hover:bg-[#FFEBEE] rounded-xl transition-colors cursor-pointer min-h-[46px] sm:min-h-[38px] flex items-center justify-center gap-1.5 text-xs font-medium border border-[#FFCDD2] sm:border-transparent active:scale-[0.98]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t('deleteThisItem', 'ลบรายการนี้')}</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ergonomic Floating Mobile Save Action Bar (Thumb-Zone Dock) */}
          <div className="md:hidden fixed bottom-[74px] left-3 right-3 z-30 animate-in slide-in-from-bottom duration-200">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="w-full btn-terracotta min-h-[52px] shadow-2xl rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border-2 border-white/20 active:scale-[0.98] transition-transform cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              <span>
                {isSaving
                  ? t('savingToSheetStatus', 'กำลังบันทึกลง Google Sheet...')
                  : user
                  ? `${t('saveToSheetWithCount', 'บันทึกลง Google Sheet')} (${extractedList.length} ${t('itemsCountUnit', 'รายการ')})`
                  : t('loginGoogle', 'เข้าสู่ระบบ Gmail เพื่อบันทึก')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Enlarged Image Lightbox */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={enlargedImage} alt="Enlarged" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};
