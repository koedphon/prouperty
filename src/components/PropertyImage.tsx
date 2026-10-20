import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Loader2, ExternalLink, Camera, Upload } from 'lucide-react';
import { loadDisplayImageSrc, extractDriveFileId } from '../services/imageStorage';
import { getAccessToken } from '../services/firebase';
import { useLanguage } from '../i18n/LanguageContext';

interface PropertyImageProps {
  imageUrl?: string | null;
  propertyId?: string | null;
  alt?: string;
  className?: string;
  onClick?: () => void;
  showDriveBadge?: boolean;
  onFileSelected?: (file: File) => void;
  isUploading?: boolean;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  imageUrl,
  propertyId,
  alt = 'Property Image',
  className = 'w-full h-full object-cover',
  onClick,
  showDriveBadge = true,
  onFileSelected,
  isUploading = false,
}) => {
  const { t } = useLanguage();
  const [displaySrc, setDisplaySrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileId = extractDriveFileId(imageUrl);
  const driveUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : null;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    loadDisplayImageSrc(imageUrl, propertyId)
      .then((src) => {
        if (isMounted) {
          if (src) {
            setDisplaySrc(src);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageUrl, propertyId]);

  const handleTriggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileSelected) {
      onFileSelected(e.target.files[0]);
    }
  };

  if (isUploading) {
    return (
      <div className="w-full h-full bg-blue-50/80 flex flex-col items-center justify-center text-blue-600 gap-1.5 p-3 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-[11px] font-bold text-blue-700">{t('uploadingImage', 'กำลังอัปโหลดรูปภาพ...')}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-gray-400 gap-1.5 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-[10px] text-gray-500 font-medium">{t('loadingImage', 'กำลังโหลดรูปภาพ...')}</span>
      </div>
    );
  }

  if (hasError || !displaySrc) {
    return (
      <div
        onClick={onFileSelected ? handleTriggerUpload : undefined}
        className={`w-full h-full bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-1.5 p-3 text-center relative group transition-all ${
          onFileSelected ? 'cursor-pointer hover:bg-blue-50/40 hover:border-blue-300' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
          {onFileSelected ? <Camera className="w-4 h-4" /> : <ImageIcon className="w-4 h-4 opacity-50" />}
        </div>
        <span className="text-[11px] font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
          {onFileSelected ? t('addImage', 'เพิ่มรูปภาพ') : t('noImage', 'ไม่มีภาพ')}
        </span>
        {onFileSelected && (
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleInputChange}
            className="hidden"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group" onClick={onClick}>
      <img
        src={displaySrc}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => {
          if (fileId) {
            const token = getAccessToken();
            const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
            if (!displaySrc.includes('/api/drive-image')) {
              setDisplaySrc(`/api/drive-image?fileId=${fileId}${tokenParam}`);
              return;
            }
            if (!displaySrc.includes('lh3.googleusercontent.com')) {
              setDisplaySrc(`https://lh3.googleusercontent.com/d/${fileId}`);
              return;
            }
            if (!displaySrc.includes('drive.google.com/thumbnail')) {
              setDisplaySrc(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
              return;
            }
          }
          setHasError(true);
        }}
      />

      {showDriveBadge && driveUrl && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <span>Drive</span>
        </div>
      )}
    </div>
  );
};
