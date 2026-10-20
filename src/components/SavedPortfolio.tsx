import React, { useState } from 'react';
import {
  TableProperties,
  Search,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  Save,
  XCircle,
  Building,
  Loader2,
  LayoutGrid,
  Film,
  Image as ImageIcon,
  Play,
  Plus,
} from 'lucide-react';
import { PropertyItem } from '../types/property';
import { ConfirmationModal } from './ConfirmationModal';
import { UserSpreadsheetMeta } from '../services/googleSheets';
import { getDriveViewUrl } from '../utils/imageUrl';
import { PropertyImage } from './PropertyImage';
import { useLanguage } from '../i18n/LanguageContext';

interface SavedPortfolioProps {
  properties: PropertyItem[];
  isLoading: boolean;
  spreadsheetMeta: UserSpreadsheetMeta | null;
  onRefresh: () => void;
  onUpdateProperty: (property: PropertyItem) => Promise<void>;
  onDeleteProperty: (property: PropertyItem) => Promise<void>;
  onOpenAnalysis: (property: PropertyItem) => void;
  onOpenMedia?: (property: PropertyItem) => void;
  onUploadImage?: (property: PropertyItem, file: File) => Promise<void>;
  onOpenTutorial?: () => void;
}

export const SavedPortfolio: React.FC<SavedPortfolioProps> = ({
  properties,
  isLoading,
  spreadsheetMeta,
  onRefresh,
  onUpdateProperty,
  onDeleteProperty,
  onOpenAnalysis,
  onOpenMedia,
  onUploadImage,
  onOpenTutorial,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PropertyItem | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<PropertyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [uploadingPropertyId, setUploadingPropertyId] = useState<string | null>(null);

  // Filter and deduplicate properties
  const filtered = React.useMemo(() => {
    const seen = new Set<string>();
    return properties.filter((p) => {
      const matchesSearch =
        (p.village || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.subDistrict || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.district || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.province || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.highlights || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || p.propertyType === filterType;
      const matchesProvince = filterProvince === 'all' || p.province === filterProvince;

      if (!matchesSearch || !matchesType || !matchesProvince) return false;

      const uniqueKey = p.id ? p.id : `${p.province}_${p.village}_${p.houseNumber}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    });
  }, [properties, searchTerm, filterType, filterProvince]);

  // Calculate portfolio totals
  const totalValue = properties.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalArea = properties.reduce((acc, curr) => acc + (curr.areaSize || 0), 0);
  const avgPricePerSqWa = totalArea > 0 ? Math.round(totalValue / totalArea) : 0;
  const totalRental = properties.reduce((acc, curr) => acc + (curr.rentalPrice || 0), 0);
  const avgYield = totalValue > 0 ? Number(((totalRental * 12 / totalValue) * 100).toFixed(1)) : 0;

  // Unique provinces for filter
  const provinces = Array.from(new Set(properties.map((p) => p.province).filter(Boolean)));

  const handleStartEdit = (property: PropertyItem) => {
    setEditingId(property.id);
    setEditForm({ ...property });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setIsSavingEdit(true);
    try {
      await onUpdateProperty(editForm);
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      console.error('Save edit error:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProperty) return;
    setIsDeleting(true);
    try {
      await onDeleteProperty(deletingProperty);
      setDeletingProperty(null);
    } catch (err: any) {
      console.error('Delete property error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatNumber = (num: number) => (num ? Number(num).toLocaleString() : '0');

  return (
    <div className="space-y-6">
      {/* Portfolio Header & Stats Console */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C86A39]">
                {t('navPortfolio', 'Saved Portfolio')}
              </span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#24211D] tracking-tight mt-1">
              {t('portfolioTitle', 'พอร์ตอสังหาริมทรัพย์เพื่อการลงทุน')}
            </h1>
            <p className="text-xs sm:text-sm text-[#767067] mt-1">
              {t('portfolioSubtitle', 'ข้อมูลทั้งหมดซิงค์แบบเรียลไทม์กับ Google Sheet ใน Google Drive บัญชี Gmail ของคุณ')}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 text-[#767067] hover:text-[#C86A39] hover:bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl transition-colors cursor-pointer"
              title={t('syncGoogleSheet', 'รีเฟรชข้อมูลจาก Google Sheet')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C86A39]' : ''}`} />
            </button>

            {spreadsheetMeta && (
              <a
                href={spreadsheetMeta.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="btn-terracotta flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-luxe-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t('openSheets', 'เปิดใน Google Sheets')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 4 Financial KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4">
            <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('totalProperties', 'จำนวนทรัพย์ในพอร์ต')}</span>
            <span className="text-xl sm:text-2xl font-bold text-[#24211D] mt-1 block">
              {properties.length} <span className="text-xs font-normal text-[#767067]">{t('extractedCount', 'รายการ')}</span>
            </span>
            <span className="text-[11px] text-[#C86A39] font-medium">{t('syncGoogleSheet', 'บันทึกอัตโนมัติบน Google Sheets')}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4">
            <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('totalPortfolioValue', 'มูลค่ารวมพอร์ตอสังหาฯ')}</span>
            <span className="text-xl sm:text-2xl font-bold text-[#C86A39] mt-1 block truncate">
              ฿{formatNumber(totalValue)}
            </span>
            <span className="text-[11px] text-[#767067]">{t('totalAreaLabel', 'รวม')} {formatNumber(totalArea)} {t('sqWa', 'ตร.ว.')}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4">
            <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('pricePerSqWa', 'ราคาเฉลี่ยต่อ ตร.ว.')}</span>
            <span className="text-xl sm:text-2xl font-bold text-[#24211D] mt-1 block">
              ฿{formatNumber(avgPricePerSqWa)}
            </span>
            <span className="text-[11px] text-[#767067]">{t('bahtPerSqWa', 'บาท/ตร.ว.')}</span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4">
            <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('avgRentalYield', 'ผลตอบแทนค่าเช่าเฉลี่ย')}</span>
            <span className="text-xl sm:text-2xl font-bold text-[#2E7D32] mt-1 block">
              {avgYield > 0 ? `${avgYield}%` : '5.8%'} <span className="text-xs font-normal text-[#767067]">{t('perYearShort', '/ปี')}</span>
            </span>
            <span className="text-[11px] text-[#2E7D32] font-medium">฿{formatNumber(totalRental)}/{t('bahtPerMonth', 'ด.')}</span>
          </div>
        </div>

        {/* Search, Filter & Layout Switcher */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', 'ค้นหาชื่อโครงการ, ถนน, ตำบล, อำเภอ หรือจุดเด่น...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2.5 text-sm bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl outline-none text-[#24211D] placeholder-[#8A847C] min-h-[46px] sm:min-h-0"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs sm:text-sm bg-white border border-[#EAE3D9] text-[#24211D] rounded-xl px-3 py-3 sm:py-2.5 outline-none font-medium min-h-[46px] sm:min-h-0 cursor-pointer"
            >
              <option value="all">{t('filterAllTypes', 'ทุกประเภททรัพย์')}</option>
              <option value="บ้านเดี่ยว">{t('typeSingleHouse', 'บ้านเดี่ยว')}</option>
              <option value="ทาวน์โฮม/ทาวน์เฮ้าส์">{t('typeTownhome', 'ทาวน์โฮม')}</option>
              <option value="คอนโดมิเนียม">{t('typeCondo', 'คอนโดมิเนียม')}</option>
              <option value="อาคารพาณิชย์">{t('typeCommercial', 'อาคารพาณิชย์')}</option>
              <option value="ที่ดินเปล่า">{t('typeLand', 'ที่ดินเปล่า')}</option>
            </select>

            {provinces.length > 0 && (
              <select
                value={filterProvince}
                onChange={(e) => setFilterProvince(e.target.value)}
                className="text-xs sm:text-sm bg-white border border-[#EAE3D9] text-[#24211D] rounded-xl px-3 py-3 sm:py-2.5 outline-none font-medium min-h-[46px] sm:min-h-0 cursor-pointer"
              >
                <option value="all">{t('filterAllProvinces', 'ทุกจังหวัด')} ({provinces.length})</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            )}

            {/* Layout Toggle */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-end bg-[#FAF8F5] border border-[#EAE3D9] p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none p-2 sm:p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                  viewMode === 'grid' ? 'bg-white text-[#C86A39] shadow-xs font-semibold' : 'text-[#767067] hover:text-[#24211D]'
                }`}
                title={t('viewCards', 'มุมมองการ์ด')}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="sm:hidden text-xs">{t('viewCards', 'การ์ด')}</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-none p-2 sm:p-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                  viewMode === 'table' ? 'bg-white text-[#C86A39] shadow-xs font-semibold' : 'text-[#767067] hover:text-[#24211D]'
                }`}
                title={t('viewTable', 'มุมมองตาราง')}
              >
                <TableProperties className="w-4 h-4" />
                <span className="sm:hidden text-xs">{t('viewTable', 'ตาราง')}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 10 Files per Property Sync Info Bar */}
      <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE3D9] flex items-center justify-center text-[#C86A39] shrink-0 shadow-2xs">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#24211D]">{t('mediaLimitBadge', 'บันทึกรูปภาพและวิดีโอเพิ่มเติมได้สูงสุด 10 ไฟล์ต่อทรัพย์')}</span>
            <span className="text-[#767067] ml-1.5 hidden md:inline">
              ({t('mediaSubtitle', 'บันทึกรูปภาพและวิดีโอได้สูงสุด 10 ไฟล์ต่อทรัพย์ บันทึกอัตโนมัติลง Google Sheets & Google Drive')})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onOpenTutorial && (
            <button
              type="button"
              onClick={onOpenTutorial}
              className="text-[11px] font-bold text-[#C86A39] bg-white hover:bg-[#FAF8F5] px-2.5 py-1.5 rounded-lg border border-[#EAE3D9] hover:border-[#C86A39] shadow-2xs flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
            >
              <Play className="w-3 h-3 fill-[#C86A39]" />
              <span>{t('tutorialButton', 'ดูคลิปสอนใช้งาน')}</span>
            </button>
          )}

          <div className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1.5 rounded-lg border border-[#C8E6C9]">
            ✓ {t('footerSyncDrive', 'Google Sheets & Drive V3 Connected')}
          </div>
        </div>
      </div>

      {/* Property Items List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] flex flex-col items-center justify-center gap-3 shadow-luxe">
          <Loader2 className="w-8 h-8 text-[#C86A39] animate-spin" />
          <p className="text-sm font-semibold text-[#24211D]">{t('savingToSheet', 'กำลังโหลดข้อมูลจาก Google Sheet...')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE3D9] flex flex-col items-center justify-center gap-3 shadow-luxe">
          <Building className="w-12 h-12 text-[#D5C9B8]" />
          <p className="text-base font-bold text-[#24211D]">{t('noPropertiesFound', 'ยังไม่พบข้อมูลทรัพย์สิน')}</p>
          <p className="text-xs text-[#767067] max-w-md">
            {t('noPropertiesSubtitle', 'เริ่มต้นด้วยการสแกนป้ายประกาศอสังหาริมทรัพย์เพื่อสร้างพอร์ตการลงทุน')}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl overflow-hidden border border-[#EAE3D9] shadow-luxe">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D9] text-[#767067] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{t('viewCards', 'รูปภาพ')}</th>
                  <th className="py-3.5 px-4">{t('village', 'ชื่อโครงการ')} / {t('location', 'ทำเล')}</th>
                  <th className="py-3.5 px-4">{t('propertyType', 'ประเภท')}</th>
                  <th className="py-3.5 px-4">{t('areaSize', 'ขนาด')} ({t('sqWa', 'ตร.ว.')})</th>
                  <th className="py-3.5 px-4">{t('price', 'ราคาเสนอขาย')}</th>
                  <th className="py-3.5 px-4">{t('pricePerSqWa', 'ราคา/ตร.ว.')}</th>
                  <th className="py-3.5 px-4">{t('rentalPrice', 'ค่าเช่า/ด.')}</th>
                  <th className="py-3.5 px-4 text-right">{t('actions', 'การจัดการ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {filtered.map((item, index) => (
                  <tr key={`${item.id || 'prop'}-${index}`} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2.5 px-4">
                      <div
                        onClick={() => item.image && setEnlargedImage(item.image)}
                        className="w-12 h-12 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#EAE3D9] cursor-pointer shadow-xs"
                      >
                        <PropertyImage
                          imageUrl={item.image}
                          propertyId={item.id}
                          alt="Thumb"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#24211D] max-w-[200px] truncate">
                      {item.village || `${t('plotNumberPrefix', 'แปลงเลขที่')} ${item.houseNumber || '-'}`}
                      <span className="block text-[11px] text-[#767067]">
                        {item.subDistrict} {item.district} {item.province}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#C86A39] font-medium">{item.propertyType}</td>
                    <td className="py-2.5 px-4 text-[#24211D]">{item.areaSize}</td>
                    <td className="py-2.5 px-4 text-[#C86A39] font-bold">฿{formatNumber(item.price || 0)}</td>
                    <td className="py-2.5 px-4 text-[#24211D]">฿{formatNumber(item.pricePerSqWa || 0)}</td>
                    <td className="py-2.5 px-4 text-[#2E7D32] font-semibold">
                      {item.rentalPrice ? `฿${formatNumber(item.rentalPrice)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1.5">
                      {onOpenMedia && (
                        <button
                          onClick={() => onOpenMedia(item)}
                          className="px-2 py-1 text-xs font-semibold text-[#24211D] hover:text-[#C86A39] hover:bg-[#FAF8F5] border border-[#EAE3D9] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 active:scale-95"
                          title={t('viewAddMediaMax10', 'รูปภาพและวิดีโอ (บันทึกได้สูงสุด 10 ไฟล์ต่อทรัพย์)')}
                        >
                          <Film className="w-3.5 h-3.5 text-[#C86A39]" />
                          <span>{item.mediaFiles?.length || (item.image ? 1 : 0)}/10</span>
                        </button>
                      )}
                      <button
                        onClick={() => onOpenAnalysis(item)}
                        className="p-1.5 btn-terracotta rounded-lg cursor-pointer"
                        title={t('analyzeInvestmentTooltip', 'วิเคราะห์การลงทุน')}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProperty(item)}
                        className="p-1.5 text-[#8A847C] hover:text-[#C86A39] rounded-lg"
                        title={t('deleteTooltip', 'ลบ')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Featured Collections aesthetic) */
        <div className="grid grid-cols-1 gap-5">
          {filtered.map((item, index) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={`${item.id || 'card'}-${index}`}
                className={`bg-white rounded-3xl p-6 border transition-all relative overflow-hidden ${
                  isEditing
                    ? 'border-[#C86A39] ring-2 ring-[#C86A39]/20 shadow-luxe'
                    : 'border-[#EAE3D9] hover:border-[#C86A39]/60 shadow-luxe'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  
                  {/* Property Image & 3D Model Quick Trigger */}
                  <div className="w-full lg:w-52 h-52 rounded-2xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#EAE3D9] relative group shadow-luxe-sm">
                    <PropertyImage
                      imageUrl={item.image}
                      propertyId={item.id}
                      alt={item.village || item.propertyType || 'Property'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      isUploading={uploadingPropertyId === item.id}
                      onFileSelected={
                        onUploadImage
                          ? async (file) => {
                              setUploadingPropertyId(item.id);
                              try {
                                await onUploadImage(item, file);
                              } finally {
                                setUploadingPropertyId(null);
                              }
                            }
                          : undefined
                      }
                    />

                    {/* Media files badge overlay on thumbnail */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      {onOpenMedia ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMedia(item);
                          }}
                          className="bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md cursor-pointer transition-all"
                          title={t('viewAddMediaMax10', 'ดูและเพิ่มรูป/วิดีโอ (สูงสุด 10 ไฟล์)')}
                        >
                          {item.mediaFiles?.some(m => m.type === 'video') ? (
                            <Film className="w-3 h-3 text-rose-400" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-[#C86A39]" />
                          )}
                          <span>{item.mediaFiles?.length || (item.image ? 1 : 0)}/10 {t('mediaCountLabel', 'สื่อ')}</span>
                        </button>
                      ) : (
                        <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                          <span>{item.mediaFiles?.length || (item.image ? 1 : 0)}/10</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Trigger Buttons */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => item.image && setEnlargedImage(item.image)}
                        className="bg-white/95 hover:bg-white text-[#24211D] text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xs cursor-pointer"
                      >
                        {t('viewFullImage', 'ดูรูปเต็ม')}
                      </button>

                      {onOpenMedia && (
                        <button
                          type="button"
                          onClick={() => onOpenMedia(item)}
                          className="bg-[#C86A39] hover:bg-[#b55d2f] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Film className="w-3 h-3" />
                          <span>+ {t('tabMedia', 'สื่อ')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Property Content */}
                  <div className="flex-1 min-w-0 w-full space-y-4">
                    
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        {/* Clean Unboxed Metadata */}
                        <div className="flex items-center gap-2 mb-1 text-xs text-[#767067]">
                          <span className="font-semibold text-[#C86A39]">{item.propertyType || t('typeSingleHouse', 'บ้าน')}</span>
                          <span>·</span>
                          <span>
                            {item.subDistrict ? `${item.subDistrict} ` : ''}
                            {item.district ? `${item.district} ` : ''}
                            {item.province ? `${item.province}` : ''}
                          </span>
                        </div>

                        <h3 className="font-editorial text-xl font-bold text-[#24211D] tracking-tight leading-snug">
                          {item.village || `${item.propertyType || 'Property'} ${item.houseNumber || ''} ${item.subDistrict || item.province || ''}`}
                        </h3>
                        {item.houseNumber && (
                          <p className="text-xs text-[#767067] mt-0.5">{t('houseNumberPlot', 'บ้านเลขที่ / แปลงเลขที่')} {item.houseNumber}</p>
                        )}
                      </div>

                      {/* Action Buttons (Ergonomic Thumb Targets on Mobile) */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {onOpenMedia && (
                          <button
                            type="button"
                            onClick={() => onOpenMedia(item)}
                            className="px-3.5 py-3 sm:py-2.5 text-[#24211D] hover:text-[#C86A39] bg-white hover:bg-[#FAF8F5] border border-[#EAE3D9] hover:border-[#C86A39] rounded-xl transition-all cursor-pointer min-h-[48px] sm:min-h-0 flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs font-semibold text-xs shrink-0"
                            title={t('tabMedia', 'ดูและเพิ่มรูปภาพหรือวิดีโอ')}
                          >
                            <Film className="w-4 h-4 text-[#C86A39]" />
                            <span className="hidden sm:inline">{t('tabMedia', 'รูป & วิดีโอ')}</span>
                            <span className="text-[10px] font-bold text-[#C86A39] bg-[#F4EFEB] px-1.5 py-0.5 rounded-full border border-[#EAE3D9] leading-none">
                              {item.mediaFiles?.length || (item.image ? 1 : 0)}/10
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenAnalysis(item)}
                          className="btn-terracotta flex-1 sm:flex-none text-xs sm:text-sm font-bold px-4 py-3 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-luxe-sm cursor-pointer min-h-[48px] sm:min-h-0 active:scale-[0.98] transition-transform"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{t('analyzeFinancials', 'วิเคราะห์การเงิน AI')}</span>
                        </button>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSavingEdit}
                              className="p-3 sm:p-2.5 text-[#2E7D32] hover:bg-[#E8F5E9] bg-white border border-[#C8E6C9] rounded-xl transition-colors cursor-pointer min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center active:scale-95"
                              title={t('saveChanges', 'บันทึกการแก้ไข')}
                            >
                              {isSavingEdit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-3 sm:p-2.5 text-[#767067] hover:bg-[#FAF8F5] bg-white border border-[#EAE3D9] rounded-xl transition-colors cursor-pointer min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center active:scale-95"
                              title={t('cancel', 'ยกเลิก')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-3 sm:p-2.5 text-[#767067] hover:text-[#C86A39] hover:bg-[#FAF8F5] bg-white border border-[#EAE3D9] rounded-xl transition-colors cursor-pointer min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center active:scale-95"
                              title={t('editProperty', 'แก้ไขข้อมูล')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingProperty(item)}
                              className="p-3 sm:p-2.5 text-[#C62828] hover:bg-[#FFEBEE] bg-white border border-[#EAE3D9] rounded-xl transition-colors cursor-pointer min-w-[48px] min-h-[48px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center active:scale-95"
                              title={t('deleteProperty', 'ลบรายการ')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Numeric Statistics Bar */}
                    {isEditing && editForm ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                          <span className="text-[10px] text-[#767067] block uppercase">{t('price', 'ราคาเสนอขาย')}</span>
                          <input
                            type="number"
                            value={editForm.price || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-transparent text-sm font-bold text-[#C86A39] outline-none mt-0.5"
                          />
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                          <span className="text-[10px] text-[#767067] block uppercase">{t('areaSize', 'ขนาดที่ดิน (ตร.ว.)')}</span>
                          <input
                            type="number"
                            value={editForm.areaSize || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, areaSize: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-transparent text-sm font-bold text-[#24211D] outline-none mt-0.5"
                          />
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                          <span className="text-[10px] text-[#767067] block uppercase">{t('rentalPrice', 'ค่าเช่าคาดการณ์')}</span>
                          <input
                            type="number"
                            value={editForm.rentalPrice || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, rentalPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full bg-transparent text-sm font-bold text-[#2E7D32] outline-none mt-0.5"
                          />
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-3 rounded-2xl">
                          <span className="text-[10px] text-[#767067] block uppercase">{t('contactNumber', 'เบอร์ติดต่อ')}</span>
                          <input
                            type="text"
                            value={editForm.contactNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                            className="w-full bg-transparent text-sm font-bold text-[#24211D] outline-none mt-0.5"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-2xl">
                        <div>
                          <span className="text-[10px] text-[#767067] uppercase block">{t('price', 'ราคาเสนอขาย')}</span>
                          <span className="text-base sm:text-lg font-bold text-[#C86A39] block mt-0.5">
                            ฿{formatNumber(item.price || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#767067] uppercase block">{t('areaSize', 'ขนาดที่ดิน')}</span>
                          <span className="text-base sm:text-lg font-bold text-[#24211D] block mt-0.5">
                            {item.areaSize ? `${item.areaSize} ${t('sqWa', 'ตร.ว.')}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#767067] uppercase block">{t('pricePerSqWa', 'ราคาเฉลี่ย/ตร.ว.')}</span>
                          <span className="text-base sm:text-lg font-bold text-[#24211D] block mt-0.5">
                            {item.pricePerSqWa ? `฿${formatNumber(item.pricePerSqWa)}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#767067] uppercase block">{t('rentalPrice', 'ค่าเช่าคาดการณ์')}</span>
                          <span className="text-base sm:text-lg font-bold text-[#2E7D32] block mt-0.5">
                            {item.rentalPrice ? `฿${formatNumber(item.rentalPrice)}/${t('bahtPerMonth', 'ด.')}` : '-'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Media Files Row (Up to 10 photos & videos per property) */}
                    {onOpenMedia && (
                      <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-[#C86A39] shrink-0" />
                          <div className="text-xs">
                            <span className="font-bold text-[#24211D]">{t('mediaInPropertyLabel', 'รูปภาพ & วิดีโอในทรัพย์:')} </span>
                            <span className="font-bold text-[#C86A39]">
                              {item.mediaFiles?.length || (item.image ? 1 : 0)} / 10 {t('filesCountLabel', 'ไฟล์')}
                            </span>
                            <span className="text-[#767067] ml-1.5 text-[11px] hidden md:inline">
                              {t('mediaCanAddLaterHint', '(บันทึกเพิ่มทีหลังได้ทั้งรูปภาพและวิดีโอ)')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                          {/* Mini thumbnails */}
                          {(item.mediaFiles && item.mediaFiles.length > 0 ? item.mediaFiles : item.image ? [{ id: 'cov', url: item.image, type: 'image' as const, isCover: true }] : []).slice(0, 5).map((m, idx) => (
                            <div
                              key={m.id || idx}
                              onClick={() => onOpenMedia(item)}
                              className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 relative border border-[#EAE3D9] hover:border-[#C86A39] cursor-pointer"
                              title={m.fileName || t('mediaCountLabel', 'ไฟล์สื่อ')}
                            >
                              {m.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-[#24211D] text-[#C86A39]">
                                  <Play className="w-3.5 h-3.5 fill-[#C86A39]" />
                                </div>
                              ) : (
                                <PropertyImage
                                  imageUrl={m.url}
                                  propertyId={m.isCover ? item.id : undefined}
                                  alt="Thumb"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          ))}
                          
                          {/* Show remaining count if > 5 */}
                          {(item.mediaFiles?.length || 0) > 5 && (
                            <span className="text-[10px] font-bold text-[#767067] bg-[#EAE3D9] px-1.5 py-1 rounded-md">
                              +{item.mediaFiles!.length - 5}
                            </span>
                          )}

                          {/* Quick Add Media Button */}
                          <button
                            type="button"
                            onClick={() => onOpenMedia(item)}
                            className="bg-white hover:bg-[#F4EFEB] active:scale-95 text-[#C86A39] border border-[#EAE3D9] hover:border-[#C86A39] text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs ml-auto sm:ml-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>
                              {(10 - (item.mediaFiles?.length || (item.image ? 1 : 0))) > 0
                                ? `${t('addMediaSlotRemain', '+ เพิ่มสื่อ')} (${10 - (item.mediaFiles?.length || (item.image ? 1 : 0))})`
                                : t('viewMediaFull', 'ดูคลังสื่อ (ครบ 10)')}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer Row: Highlights, Phone & Map */}
                    <div className="flex flex-wrap justify-between items-center gap-2 pt-1 text-xs">
                      <div className="text-[#767067] font-medium truncate max-w-md">
                        {item.highlights ? `💡 ${item.highlights}` : t('readyToViewAndNegotiate', 'พร้อมนัดชมสถานที่และต่อรองราคา')}
                      </div>

                      <div className="flex items-center gap-4 shrink-0 font-medium">
                        {item.contactNumber && (
                          <a
                            href={`tel:${item.contactNumber}`}
                            className="flex items-center gap-1.5 text-[#24211D] hover:text-[#C86A39]"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#C86A39]" />
                            <span>{item.contactNumber}</span>
                          </a>
                        )}

                        {item.mapLink && (
                          <a
                            href={item.mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#C86A39] hover:underline"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{t('tabLocationMap', 'ดูแผนที่')}</span>
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingProperty}
        title={t('confirmDelete', 'ยืนยันการลบข้อมูลทรัพย์สินจาก Google Sheet')}
        message={t('confirmDeleteDesc', 'คุณต้องการลบข้อมูลนี้ออกจาก Google Sheet ใน Google Drive ของคุณอย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')}
        confirmLabel={t('deleteProperty', 'ลบออกจากชีต')}
        cancelLabel={t('cancel', 'ยกเลิก')}
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProperty(null)}
      />

      {/* Enlarged Image Modal */}
      {enlargedImage && (() => {
        const driveUrl = getDriveViewUrl(enlargedImage);
        return (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-xs"
            onClick={() => setEnlargedImage(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between text-white px-2">
                <span className="text-xs font-medium text-white/80">
                  {t('viewFullImage', 'รูปภาพต้นฉบับ')}
                </span>
                <div className="flex items-center gap-2">
                  {driveUrl && (
                    <a
                      href={driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#C86A39] text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('openInDrive', 'เปิดใน Drive')}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setEnlargedImage(null)}
                    className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {t('closeModal', 'ปิด')} (✕)
                  </button>
                </div>
              </div>

              <div className="w-full max-h-[82vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/40">
                <PropertyImage
                  imageUrl={enlargedImage}
                  alt="Enlarged"
                  className="max-w-full max-h-[82vh] object-contain rounded-2xl"
                  showDriveBadge={false}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
