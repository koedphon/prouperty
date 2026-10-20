import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Star,
  ExternalLink,
  Play,
  Loader2,
  Plus,
  AlertCircle,
  FileVideo,
  ShieldCheck,
} from 'lucide-react';
import { PropertyItem, PropertyMediaItem } from '../types/property';
import { extractDriveFileId } from '../services/imageStorage';
import { PropertyImage } from './PropertyImage';
import { useLanguage } from '../i18n/LanguageContext';

interface PropertyMediaModalProps {
  property: PropertyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadMedia: (property: PropertyItem, files: File[]) => Promise<void>;
  onDeleteMedia: (property: PropertyItem, mediaId: string) => Promise<void>;
  onSetCoverMedia: (property: PropertyItem, mediaId: string) => Promise<void>;
  token?: string | null;
}

export const PropertyMediaModal: React.FC<PropertyMediaModalProps> = ({
  property,
  isOpen,
  onClose,
  onUploadMedia,
  onDeleteMedia,
  onSetCoverMedia,
  token,
}) => {
  const { t } = useLanguage();
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !property) return null;

  const mediaList: PropertyMediaItem[] = property.mediaFiles && property.mediaFiles.length > 0
    ? property.mediaFiles
    : property.image
    ? [
        {
          id: `media-cover-${property.id}`,
          url: property.image,
          type: 'image',
          fileName: t('primaryPhotoLabel', 'รูปภาพหลัก'),
          isCover: true,
        },
      ]
    : [];

  const totalCount = mediaList.length;
  const maxLimit = 10;
  const remainingSlots = Math.max(0, maxLimit - totalCount);

  // Active media item being viewed
  const activeMedia = mediaList.find((m) => m.id === selectedMediaId) || mediaList.find((m) => m.isCover) || mediaList[0] || null;

  const photoCount = mediaList.filter((m) => m.type === 'image').length;
  const videoCount = mediaList.filter((m) => m.type === 'video').length;

  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (totalCount >= maxLimit) {
      setErrorMsg(t('mediaLimitReachedMsg', 'ทรัพย์สินนี้บันทึกรูปภาพและวิดีโอครบ 10 ไฟล์แล้ว'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      setErrorMsg(`${t('maxUploadRemaining', 'เลือกได้อีกสูงสุด')} ${remainingSlots} ${t('filesCountLabel', 'ไฟล์')} (${t('willUploadFirstOnly', 'จะอัปโหลดเพียง')} ${remainingSlots} ${t('firstFilesLabel', 'ไฟล์แรก')})`);
    }

    const filesToUpload = files.slice(0, remainingSlots);

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onUploadMedia(property, filesToUpload);
      setSuccessMsg(`${t('mediaUploadSuccessMsg', 'อัปโหลดและบันทึกลง Google Sheet เรียบร้อยแล้ว')} (${filesToUpload.length} ${t('filesCountLabel', 'ไฟล์')})`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to upload media:', err);
      setErrorMsg(err.message || t('mediaUploadErrorMsg', 'การอัปโหลดไฟล์สื่อขัดข้อง กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await handleUploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await handleUploadFiles(files);
    }
  };

  const handleDelete = async (mediaItem: PropertyMediaItem) => {
    if (!window.confirm(t('deleteMediaConfirm', 'คุณต้องการลบไฟล์สื่อนี้ออกจากทรัพย์และ Google Sheet หรือไม่?'))) {
      return;
    }

    setDeletingId(mediaItem.id);
    setErrorMsg(null);
    try {
      await onDeleteMedia(property, mediaItem.id);
      if (selectedMediaId === mediaItem.id) {
        setSelectedMediaId(null);
      }
      setSuccessMsg(t('mediaDeleteSuccessMsg', 'ลบไฟล์สื่อและอัปเดต Google Sheet สำเร็จ'));
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to delete media:', err);
      setErrorMsg(err.message || t('mediaDeleteErrorMsg', 'ไม่สามารถลบไฟล์สื่อได้'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetCover = async (mediaItem: PropertyMediaItem) => {
    if (mediaItem.type !== 'image') {
      setErrorMsg(t('coverImagePhotoOnlyMsg', 'สามารถเลือกเฉพาะรูปภาพเป็นรูปหน้าปกได้'));
      return;
    }

    try {
      await onSetCoverMedia(property, mediaItem.id);
      setSuccessMsg(t('coverSetSuccessMsg', 'ตั้งเป็นรูปหน้าปกและบันทึก Google Sheet เรียบร้อยแล้ว'));
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to set cover photo:', err);
      setErrorMsg(err.message || t('coverSetErrorMsg', 'ไม่สามารถตั้งเป็นรูปหน้าปกได้'));
    }
  };

  const activeDriveFileId = activeMedia ? extractDriveFileId(activeMedia.url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden overscroll-contain">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full h-[96dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAE3D9] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Mobile Drag Pill */}
        <div className="sm:hidden pt-2.5 pb-1 bg-[#FAF8F5] flex justify-center shrink-0">
          <div className="w-12 h-1 bg-[#D5C9B8] rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="bg-[#FAF8F5] px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shrink-0 border-b border-[#EAE3D9]">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-editorial text-base sm:text-xl font-bold text-[#24211D] truncate flex items-center gap-2">
                <Film className="w-5 h-5 text-[#C86A39] shrink-0" />
                <span>{t('mediaTitle', 'คลังรูปภาพและวิดีโอ')}</span>
              </h2>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                totalCount >= maxLimit
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-[#F4EFEB] text-[#C86A39] border-[#EAE3D9]'
              }`}>
                {totalCount} / {maxLimit} {t('mediaCountLabel', 'ไฟล์สื่อ')}
              </span>
            </div>

            <p className="text-xs text-[#767067] mt-0.5 truncate">
              {property.village || property.propertyType || t('propertyLabel', 'ทรัพย์สิน')} · {property.district} {property.province}
              <span className="hidden sm:inline text-[#2E7D32] ml-2">
                ({photoCount} {t('photosCount', 'รูปภาพ')} · {videoCount} {t('videosCount', 'วิดีโอ')})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {remainingSlots > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-terracotta text-xs font-bold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 touch-manipulation min-h-[40px]"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{t('addMediaButton', 'เพิ่มรูป/วิดีโอ')}</span>
                <span className="sm:hidden">+{t('mediaCountLabel', 'สื่อ')}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-[#767067] hover:text-[#24211D] p-2 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 shadow-xs touch-manipulation"
              title={t('closeModal', 'ปิดหน้าต่าง')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden File Input (Accepts Images and Videos) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
          multiple
          className="hidden"
          onChange={handleSelectFiles}
        />

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1 font-medium">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1 font-medium">{successMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">

          {/* 1. Large Active Media Preview Showcase */}
          {activeMedia ? (
            <div className="bg-[#1A1816] rounded-2xl overflow-hidden shadow-luxe-lg border border-[#3A3530] flex flex-col">
              
              {/* Media Player / Viewer */}
              <div className="relative w-full aspect-video sm:aspect-21/9 max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
                {activeMedia.type === 'video' ? (
                  activeDriveFileId ? (
                    /* Google Drive Embedded Video Player */
                    <iframe
                      src={`https://drive.google.com/file/d/${activeDriveFileId}/preview`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      title={activeMedia.fileName || 'Video Player'}
                    />
                  ) : (
                    /* Direct HTML5 Video Player */
                    <video
                      src={activeMedia.url}
                      controls
                      autoPlay={false}
                      className="w-full h-full object-contain"
                    >
                      {t('browserDoesNotSupportVideo', 'เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ')}
                    </video>
                  )
                ) : (
                  /* High Resolution Image Viewer */
                  <div className="w-full h-full relative group">
                    <PropertyImage
                      imageUrl={activeMedia.url}
                      propertyId={activeMedia.isCover ? property.id : undefined}
                      alt={activeMedia.fileName || 'Property Photo'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Cover Photo Badge on Main Preview */}
                {activeMedia.isCover && (
                  <div className="absolute top-3 left-3 bg-[#C86A39] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                    <span>{t('coverPhoto', 'รูปหน้าปกหลัก')}</span>
                  </div>
                )}

                {/* Media Type Indicator */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/20">
                  {activeMedia.type === 'video' ? (
                    <>
                      <FileVideo className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t('videoTypeBadge', 'วิดีโอ (Video)')}</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t('photoTypeBadge', 'รูปภาพ (Photo)')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Active Media Action Toolbar */}
              <div className="p-3 bg-[#24211D] text-white flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-white/90 truncate max-w-[200px] sm:max-w-xs">
                    {activeMedia.fileName || (activeMedia.type === 'video' ? t('videoFileDefault', 'ไฟล์วิดีโอ') : t('imageFileDefault', 'ไฟล์รูปภาพ'))}
                  </span>
                  {activeMedia.dateAdded && (
                    <span className="text-[11px] text-white/50">· {activeMedia.dateAdded}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Set As Cover Button (Only for images) */}
                  {activeMedia.type === 'image' && !activeMedia.isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(activeMedia)}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title={t('setAsCoverTooltip', 'ตั้งให้รูปนี้เป็นรูปหน้าปกหลักของทรัพย์ในพอร์ตและ Google Sheet')}
                    >
                      <Star className="w-3.5 h-3.5 text-[#C86A39]" />
                      <span>{t('setAsCover', 'ตั้งเป็นรูปหลัก')}</span>
                    </button>
                  )}

                  {/* Open in Google Drive */}
                  {activeMedia.url && activeMedia.url.startsWith('http') && (
                    <a
                      href={activeMedia.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-white rounded-lg transition-all flex items-center gap-1"
                      title={t('openInDriveTooltip', 'เปิดดูไฟล์ต้นฉบับใน Google Drive')}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>{t('openInDrive', 'ดูใน Drive')}</span>
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(activeMedia)}
                    disabled={deletingId === activeMedia.id}
                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    title={t('deleteMediaTooltip', 'ลบไฟล์สื่อนี้')}
                  >
                    {deletingId === activeMedia.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-[#FAF8F5] border-2 border-dashed border-[#DDD5CA] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAE3D9] flex items-center justify-center text-[#C86A39] shadow-sm">
                <Film className="w-8 h-8" />
              </div>
              <div>
                <p className="font-editorial text-base sm:text-lg font-bold text-[#24211D]">
                  {t('noMediaYetTitle', 'ยังไม่มีรูปภาพหรือวิดีโอเพิ่มเติมในทรัพย์สินนี้')}
                </p>
                <p className="text-xs text-[#767067] max-w-md mt-1">
                  {t('noMediaYetDesc', 'สามารถอัปโหลดรูปภาพและวิดีโอรีวิวบ้าน หน้างาน หรือห้องต่างๆ ได้สูงสุด 10 ไฟล์ต่อทรัพย์ (ซิงก์ Google Drive อัตโนมัติ)')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-terracotta text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ {t('uploadFirstMediaBtn', 'อัปโหลดรูปหรือวิดีโอแรก')}</span>
              </button>
            </div>
          )}

          {/* 2. Grid of 10 Media Slots (Interactive Selector & Empty Slot Dropzones) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-[#24211D] uppercase tracking-wider flex items-center gap-1.5">
                <span>{t('allMediaList', 'รายการสื่อทั้งหมด')}</span>
                <span className="text-[#C86A39]">({totalCount}/{maxLimit})</span>
              </h3>
              <span className="text-[11px] text-[#767067]">
                {remainingSlots > 0 ? `${t('canAddMorePrefix', 'สามารถเพิ่มได้อีก')} ${remainingSlots} ${t('filesCountLabel', 'ไฟล์')}` : t('quotaFull10Files', 'บันทึกครบโควตา 10 ไฟล์แล้ว')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Existing media slots */}
              {mediaList.map((item, index) => {
                const isSelected = activeMedia?.id === item.id;
                return (
                  <div
                    key={item.id || index}
                    onClick={() => setSelectedMediaId(item.id)}
                    className={`relative rounded-2xl overflow-hidden aspect-4/3 cursor-pointer group transition-all border-2 ${
                      isSelected
                        ? 'border-[#C86A39] ring-2 ring-[#C86A39]/30 shadow-md scale-[1.02]'
                        : 'border-[#EAE3D9] hover:border-[#C86A39]/60 shadow-xs'
                    }`}
                  >
                    {/* Media Thumbnail */}
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-[#24211D] flex flex-col items-center justify-center text-white relative">
                        <Play className="w-8 h-8 text-[#C86A39] fill-[#C86A39]" />
                        <span className="text-[10px] font-bold mt-1 text-white/80">{t('videoLabel', 'วิดีโอ')}</span>
                      </div>
                    ) : (
                      <PropertyImage
                        imageUrl={item.url}
                        propertyId={item.isCover ? property.id : undefined}
                        alt={item.fileName || 'Thumb'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}

                    {/* Cover Badge */}
                    {item.isCover && (
                      <div className="absolute top-1.5 left-1.5 bg-[#C86A39] text-white p-1 rounded-md shadow-xs" title={t('coverPhoto', 'รูปหน้าปก')}>
                        <Star className="w-3 h-3 fill-white text-white" />
                      </div>
                    )}

                    {/* Video Tag */}
                    {item.type === 'video' && (
                      <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Film className="w-2.5 h-2.5 text-rose-400" />
                        <span>VDO</span>
                      </div>
                    )}

                    {/* Slot Number */}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>

                    {/* Quick Set Cover Button on hover (if image & not already cover) */}
                    {item.type === 'image' && !item.isCover && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCover(item);
                        }}
                        className="absolute bottom-1.5 right-7 p-1 bg-black/60 hover:bg-[#C86A39] text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title={t('setAsCover', 'ตั้งเป็นรูปหน้าปกหลัก')}
                      >
                        <Star className="w-3 h-3 fill-white" />
                      </button>
                    )}

                    {/* Quick Delete Overlay Button on hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="absolute bottom-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title={t('deleteFileTooltip', 'ลบไฟล์นี้')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Empty Available Slots (Up to 10 total) */}
              {Array.from({ length: remainingSlots }).map((_, idx) => (
                <div
                  key={`empty-slot-${idx}`}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-[#DDD5CA] hover:border-[#C86A39] bg-[#FAF8F5] hover:bg-[#F4EFEB] aspect-4/3 flex flex-col items-center justify-center gap-1 text-[#8A847C] hover:text-[#C86A39] cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="w-7 h-7 rounded-xl bg-white border border-[#EAE3D9] flex items-center justify-center group-hover:border-[#C86A39]/60 shadow-2xs">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold">{t('slotNumberPrefix', 'ช่องที่')} {totalCount + idx + 1}</span>
                  <span className="text-[9px] text-[#A39D93]">{t('photoOrVideoLabel', 'รูปหรือวิดีโอ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Drag and Drop Zone if slots remain */}
          {remainingSlots > 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 group ${
                isDragging
                  ? 'border-[#C86A39] bg-[#F4EFEB] ring-4 ring-[#C86A39]/20 scale-[1.01]'
                  : 'border-[#DDD5CA] hover:border-[#C86A39] bg-[#FAF8F5] hover:bg-[#F4EFEB]'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE3D9] flex items-center justify-center text-[#C86A39] group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#24211D]">
                    {isDragging ? t('dropFilesHereNow', 'ปล่อยไฟล์ที่นี่เพื่ออัปโหลดทันที') : t('dropMediaHere', 'ลากไฟล์รูปภาพหรือวิดีโอมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์')}
                  </p>
                  <p className="text-[11px] text-[#767067]">
                    {t('supportedMediaFormats', 'รองรับไฟล์ MP4, MOV, WEBM, JPG, PNG · สูงสุด 10 ไฟล์ต่อทรัพย์')} ({t('remainingSlotsLabel', 'เหลืออีก')} {remainingSlots} {t('slotsUnit', 'ช่อง')})
                  </p>
                </div>
              </div>

              <div className="btn-terracotta text-xs font-bold px-4 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>{t('chooseMediaFilesBtn', 'เลือกไฟล์สื่อ')}</span>
              </div>
            </div>
          )}

          {/* Sync status info */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] flex items-center gap-2 text-xs text-[#767067]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>
              {t('mediaSyncStorageAssurance', 'ทุกไฟล์รูปภาพและวิดีโอจะถูกจัดเก็บในโฟลเดอร์ Google Drive ของคุณอย่างปลอดภัย และซิงก์อัปเดตลง Google Sheets อัตโนมัติ')}
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#EAE3D9] flex justify-between items-center shrink-0">
          <div className="text-xs text-[#767067]">
            <span>{t('mediaCapacityLabel', 'ความจุสื่อ:')} </span>
            <span className="font-bold text-[#24211D]">{totalCount} / {maxLimit} {t('filesCountLabel', 'ไฟล์')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-[#F4EFEB] active:scale-95 text-[#24211D] font-bold text-xs sm:text-sm rounded-xl border border-[#EAE3D9] shadow-xs cursor-pointer"
          >
            {t('closeModal', 'ปิดหน้าต่าง')}
          </button>
        </div>

      </div>
    </div>
  );
};
